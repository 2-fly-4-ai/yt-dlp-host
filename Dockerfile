# Use Alpine for smaller base image
FROM python:3.9-alpine

WORKDIR /app

# Install system dependencies in one layer and clean up
RUN apk add --no-cache \
    ffmpeg \
    gcc \
    musl-dev \
    linux-headers \
    && rm -rf /var/cache/apk/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip cache purge

# Copy application code (only what's needed)
COPY src/ ./src/
COPY config.py .
COPY jsons/ ./jsons/

# Create downloads directory
RUN mkdir -p downloads

EXPOSE 8080

ENV FLASK_APP=src/server.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=8080
ENV FLASK_ENV=production

# Use gunicorn for faster startup instead of flask dev server
RUN pip install --no-cache-dir gunicorn

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "60", "src.server:app"]
