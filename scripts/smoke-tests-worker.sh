#!/bin/bash

# Smoke tests for Docker Worker setup
# Run this after deploying the worker to verify everything works

set -e

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
REDIS_URL=${REDIS_URL:-"redis://localhost:6379"}

echo "🧪 Running smoke tests for Docker Worker setup"
echo "Base URL: $BASE_URL"
echo "Redis URL: $REDIS_URL"

# Test 1: Health check
echo "1️⃣ Testing API health..."
curl -f "$BASE_URL/api/health" || {
    echo "❌ API health check failed"
    exit 1
}
echo "✅ API health check passed"

# Test 2: Redis connection
echo "2️⃣ Testing Redis connection..."
if command -v redis-cli &> /dev/null; then
    redis-cli -u "$REDIS_URL" ping || {
        echo "❌ Redis connection failed"
        exit 1
    }
    echo "✅ Redis connection passed"
else
    echo "⚠️  redis-cli not found, skipping Redis test"
fi

# Test 3: Video upload init
echo "3️⃣ Testing video upload init..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/video/upload-init" \
    -H "Content-Type: application/json" \
    -d '{"fileName": "test-video.mp4", "fileSize": 1024000}' \
    -H "Authorization: Bearer test-token" || echo "{}")

if echo "$UPLOAD_RESPONSE" | grep -q "uploadUrl"; then
    echo "✅ Video upload init passed"
    UPLOAD_KEY=$(echo "$UPLOAD_RESPONSE" | grep -o '"storageKey":"[^"]*"' | cut -d'"' -f4)
    echo "   Storage key: $UPLOAD_KEY"
else
    echo "❌ Video upload init failed"
    echo "   Response: $UPLOAD_RESPONSE"
    exit 1
fi

# Test 4: Video processing (enqueue)
echo "4️⃣ Testing video processing enqueue..."
PROCESS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/video/process" \
    -H "Content-Type: application/json" \
    -d "{\"fileId\": \"test-file-id\", \"style\": \"Barbie\"}" \
    -H "Authorization: Bearer test-token" || echo "{}")

if echo "$PROCESS_RESPONSE" | grep -q "jobId"; then
    echo "✅ Video processing enqueue passed"
    JOB_ID=$(echo "$PROCESS_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
    echo "   Job ID: $JOB_ID"
else
    echo "❌ Video processing enqueue failed"
    echo "   Response: $PROCESS_RESPONSE"
    exit 1
fi

# Test 5: Job status check
if [ -n "$JOB_ID" ]; then
    echo "5️⃣ Testing job status check..."
    STATUS_RESPONSE=$(curl -s "$BASE_URL/api/video/job/$JOB_ID" \
        -H "Authorization: Bearer test-token" || echo "{}")
    
    if echo "$STATUS_RESPONSE" | grep -q "status"; then
        echo "✅ Job status check passed"
        echo "   Status: $(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
    else
        echo "❌ Job status check failed"
        echo "   Response: $STATUS_RESPONSE"
        exit 1
    fi
fi

# Test 6: Worker health (if accessible)
echo "6️⃣ Testing worker health..."
if command -v docker &> /dev/null; then
    if docker ps | grep -q "captioni-worker"; then
        echo "✅ Worker container is running"
        
        # Check worker logs for errors
        WORKER_LOGS=$(docker logs captioni-worker 2>&1 | tail -10)
        if echo "$WORKER_LOGS" | grep -q "ERROR\|FAILED"; then
            echo "⚠️  Worker logs contain errors:"
            echo "$WORKER_LOGS"
        else
            echo "✅ Worker logs look clean"
        fi
    else
        echo "⚠️  Worker container not found"
    fi
else
    echo "⚠️  Docker not available, skipping worker health check"
fi

echo ""
echo "🎉 All smoke tests passed!"
echo ""
echo "Next steps:"
echo "1. Upload a real video file to test end-to-end processing"
echo "2. Monitor worker logs: docker compose logs -f"
echo "3. Check job status in database or via API"
echo "4. Verify R2 storage for uploaded and processed files"
