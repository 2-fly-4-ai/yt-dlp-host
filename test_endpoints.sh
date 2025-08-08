#!/bin/bash

# Test script for yt-dlp Cloudflare container endpoints
# API Key from jsons/api_keys.json
API_KEY="4E1McGjA2oOmHSPwlAJyxI3vqe5ehyqPSz2eUuUJcIE"
BASE_URL="https://yt-dlp-containers.farleythecoder.workers.dev"

echo "Testing yt-dlp Cloudflare container endpoints..."
echo "==========================================="

# Test 1: Health check
echo "1. Testing /health endpoint:"
curl -w "\n" "$BASE_URL/health"
echo ""

# Test 2: Load balancer
echo "2. Testing /lb endpoint:"
curl -w "\n" "$BASE_URL/lb"
echo ""

# Test 3: Get video info
echo "3. Testing /get_info endpoint:"
curl -X POST "$BASE_URL/get_info" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtu.be/dQw4w9WgXcQ"}' \
  -w "\n"
echo ""

# Test 4: Get video (short clip)
echo "4. Testing /get_video endpoint (30 second clip):"
curl -X POST "$BASE_URL/get_video" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtu.be/dQw4w9WgXcQ",
    "video_format": "bestvideo[height<=480]",
    "audio_format": "bestaudio[abr<=128]",
    "start_time": 0,
    "end_time": 30
  }' \
  -w "\n"
echo ""

# Test 5: Get audio only
echo "5. Testing /get_audio endpoint:"
curl -X POST "$BASE_URL/get_audio" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtu.be/dQw4w9WgXcQ",
    "audio_format": "bestaudio[abr<=128]",
    "start_time": 0,
    "end_time": 15
  }' \
  -w "\n"
echo ""

echo "Test completed!"
echo "Note: If you get task_id responses, use this to check status:"
echo "curl -H 'X-API-Key: $API_KEY' '$BASE_URL/status/YOUR_TASK_ID'"