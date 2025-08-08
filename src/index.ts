import { Container } from "@cloudflare/containers";

export class MyContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "3000s";
  timeout = "3000s";
  manualStart = true;

  override onStart() {
    console.log("YT-DLP Container successfully started");
  }

  override onStop() {
    console.log("YT-DLP Container successfully shut down");
  }

  override onError(error: unknown) {
    console.log("YT-DLP Container error:", error);
  }

  async fetch(request: Request): Promise<Response> {
    try {
      // Forward request to the container - let the Container class handle startup
      return await this.containerFetch(request);
    } catch (error) {
      console.error("Container fetch error:", error);

      // If container startup error, return helpful message
      if (
        error.toString().includes("not running") ||
        error.toString().includes("blockConcurrencyWhile")
      ) {
        return new Response(
          JSON.stringify({
            status: "starting",
            message:
              "Container is starting up, please try again in 10-15 seconds",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          status: "error",
          message: `Container Error: ${error}`,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}

export interface Env {
  MY_CONTAINER: DurableObjectNamespace;
  R2_BUCKET: R2Bucket;
}

function getRandom(
  namespace: DurableObjectNamespace,
  numInstances: number
): DurableObjectStub {
  const randomId = Math.floor(Math.random() * numInstances);
  const id = namespace.idFromName(`instance-${randomId}`);
  return namespace.get(id);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      // Route specific containers by path
      if (pathname.startsWith("/container")) {
        const id = env.MY_CONTAINER.idFromName(pathname);
        const container = env.MY_CONTAINER.get(id);
        
        await container.start({
          envVars: {
            FLASK_APP: "src/server.py",
            FLASK_RUN_HOST: "0.0.0.0",
            FLASK_RUN_PORT: "8080",
            FLASK_ENV: "production",
            USE_WORKER_R2_BINDING: "true",
          },
        });
        
        return await container.fetch(request);
      }

      // Load balance across multiple containers
      if (pathname.startsWith("/lb")) {
        const container = getRandom(env.MY_CONTAINER, 3);
        
        await container.start({
          envVars: {
            FLASK_APP: "src/server.py",
            FLASK_RUN_HOST: "0.0.0.0",
            FLASK_RUN_PORT: "8080",
            FLASK_ENV: "production",
            USE_WORKER_R2_BINDING: "true",
          },
        });
        
        return await container.fetch(request);
      }

      // Default routing - send to a single container
      if (
        pathname.startsWith("/get_") ||
        pathname.startsWith("/status") ||
        pathname.startsWith("/files") ||
        pathname.startsWith("/create_key") ||
        pathname.startsWith("/delete_key") ||
        pathname.startsWith("/get_key") ||
        pathname.startsWith("/check_permissions")
      ) {
        const id = env.MY_CONTAINER.idFromName("yt-dlp-main-v2");
        const container = env.MY_CONTAINER.get(id);
        
        await container.start({
          envVars: {
            FLASK_APP: "src/server.py",
            FLASK_RUN_HOST: "0.0.0.0",
            FLASK_RUN_PORT: "8080",
            FLASK_ENV: "production",
            USE_WORKER_R2_BINDING: "true",
          },
        });
        
        return await container.fetch(request);
      }

      // Health check endpoint
      if (pathname === "/health") {
        return new Response("OK", { status: 200 });
      }

      // Debug endpoint to check R2 binding
      if (pathname === "/debug-secrets") {
        return new Response(JSON.stringify({
          r2_bucket_available: !!env.R2_BUCKET,
        }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // R2 upload proxy endpoint for containers
      if (pathname.startsWith("/r2-upload/")) {
        if (request.method !== "PUT") {
          return new Response("Method not allowed", { status: 405 });
        }
        
        const key = pathname.slice("/r2-upload/".length);
        if (!key) {
          return new Response("Missing key", { status: 400 });
        }

        try {
          const body = await request.arrayBuffer();
          await env.R2_BUCKET.put(key, body, {
            httpMetadata: {
              contentType: request.headers.get("Content-Type") || "application/octet-stream"
            }
          });
          
          const publicUrl = `https://5839829ae31cfcc592f0f99a0de95da3.r2.cloudflarestorage.com/yt-dlp-container/${key}`;
          return new Response(JSON.stringify({ 
            success: true, 
            url: publicUrl 
          }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (error) {
          return new Response(JSON.stringify({
            success: false,
            error: `R2 upload failed: ${error}`
          }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("Container error:", error);
      return new Response(`Container Error: ${error}`, { status: 500 });
    }
  },
};