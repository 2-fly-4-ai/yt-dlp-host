# File system
DOWNLOAD_DIR = '/app/downloads'
TASKS_FILE = 'jsons/tasks.json'
KEYS_FILE = 'jsons/api_keys.json'

# Task management
TASK_CLEANUP_TIME = 10  # minutes
REQUEST_LIMIT = 60 # per TASK_CLEANUP_TIME
MAX_WORKERS = 4

# API key settings
DEFAULT_MEMORY_QUOTA = 5 * 1024 * 1024 * 1024  # 5GB default quota (in bytes)
DEFAULT_MEMORY_QUOTA_RATE = 10  # minutes to rate limit

# Memory control
SIZE_ESTIMATION_BUFFER = 1.10
AVAILABLE_MEMORY = 20 * 1024 * 1024 * 1024  # 20GB

# R2 Storage
R2_ENDPOINT_URL = 'https://5839829ae31cfcc592f0f99a0de95da3.r2.cloudflarestorage.com'
R2_BUCKET_NAME = 'yt-dlp-container'
R2_PUBLIC_URL_BASE = 'https://5839829ae31cfcc592f0f99a0de95da3.r2.cloudflarestorage.com/yt-dlp-container'
