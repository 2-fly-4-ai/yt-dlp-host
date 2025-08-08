import requests
import os

def upload_file_to_r2(local_file_path, task_id, filename):
    try:
        if not os.path.exists(local_file_path):
            raise FileNotFoundError(f"Local file not found: {local_file_path}")
        
        # Check if we should use the worker R2 binding
        use_worker_binding = os.environ.get('USE_WORKER_R2_BINDING', 'false').lower() == 'true'
        
        if use_worker_binding:
            # Use the worker's R2 upload endpoint
            key = f'{task_id}/{filename}'
            upload_url = f'https://yt-dlp-containers.farleythecoder.workers.dev/r2-upload/{key}'
            
            with open(local_file_path, 'rb') as file_data:
                response = requests.put(
                    upload_url,
                    data=file_data,
                    headers={'Content-Type': get_content_type(filename)}
                )
                
            if response.status_code == 200:
                result = response.json()
                return result
            else:
                error_msg = f"Worker R2 upload failed: {response.status_code} {response.text}"
                print(error_msg)
                return {"success": False, "url": None, "error": error_msg}
        else:
            # Fallback to boto3 approach (original code)
            import boto3
            from config import R2_ENDPOINT_URL, R2_BUCKET_NAME, R2_PUBLIC_URL_BASE
            
            access_key = os.environ.get('R2_ACCESS_KEY_ID')
            secret_key = os.environ.get('R2_SECRET_ACCESS_KEY')
            
            if not access_key or not secret_key:
                raise ValueError("R2 credentials not found. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY environment variables.")
            
            s3_client = boto3.client(
                's3',
                endpoint_url=R2_ENDPOINT_URL,
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                region_name='auto'
            )
            
            key = f'{task_id}/{filename}'
            
            with open(local_file_path, 'rb') as file_data:
                s3_client.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=key,
                    Body=file_data,
                    ContentType=get_content_type(filename)
                )
            
            public_url = f'{R2_PUBLIC_URL_BASE}/{key}'
            return {"success": True, "url": public_url, "error": None}
        
    except Exception as e:
        error_msg = f"R2 upload failed: {str(e)}"
        print(error_msg)
        return {"success": False, "url": None, "error": error_msg}

def get_content_type(filename):
    ext = filename.lower().split('.')[-1]
    content_types = {
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'm4a': 'audio/m4a',
        'json': 'application/json'
    }
    return content_types.get(ext, 'application/octet-stream')

def cleanup_local_file(file_path):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Warning: Could not remove local file {file_path}: {str(e)}")