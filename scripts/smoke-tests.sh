#!/bin/bash

# Smoke tests for video pipeline
# Based on external recommendations for systematic testing

set -e

BASE_URL=${BASE_URL:-"http://localhost:3000"}
PROD_BASE_URL=${PROD_BASE_URL:-"https://captioni.com"}

echo "🧪 Starting smoke tests for video pipeline..."
echo "Base URL: $BASE_URL"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Test 1: Health check
print_info "Testing health endpoint..."
curl -s -f "$BASE_URL/api/health" > /dev/null
print_status $? "Health check passed"

# Test 2: Demo file generation
print_info "Testing demo file generation..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/video/generate" \
  -H "content-type: application/json" \
  -d '{"demoFile":"demo/videos/demo.mp4","text":"Hello FFmpeg!"}')

if echo "$RESPONSE" | grep -q '"ok":true'; then
    print_status 0 "Demo file generation passed"
else
    print_status 1 "Demo file generation failed: $RESPONSE"
fi

# Test 3: R2 key generation (if R2 is configured)
print_info "Testing R2 key generation..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/video/generate" \
  -H "content-type: application/json" \
  -d '{"r2Key":"uploads/test.mp4","text":"From R2"}')

if echo "$RESPONSE" | grep -q '"ok":true'; then
    print_status 0 "R2 key generation passed"
elif echo "$RESPONSE" | grep -q "Failed to download from R2"; then
    print_info "R2 not configured (expected in dev)"
    print_status 0 "R2 key generation handled gracefully"
else
    print_status 1 "R2 key generation failed: $RESPONSE"
fi

# Test 4: Font validation
print_info "Testing font validation..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/video/generate" \
  -H "content-type: application/json" \
  -d '{"demoFile":"demo/videos/demo.mp4","text":"Font test"}')

if echo "$RESPONSE" | grep -q '"ok":true'; then
    print_status 0 "Font validation passed"
elif echo "$RESPONSE" | grep -q "FONT_MISSING"; then
    print_status 1 "Font missing error: $RESPONSE"
else
    print_status 1 "Font validation failed: $RESPONSE"
fi

# Test 5: Demo video upload (if demo files exist)
print_info "Testing demo video upload..."
if [ -f "public/demo/videos/demo.mp4" ]; then
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/demo/video" \
      -F "file=@public/demo/videos/demo.mp4")
    
    if echo "$RESPONSE" | grep -q '"ok":true'; then
        print_status 0 "Demo video upload passed"
    else
        print_status 1 "Demo video upload failed: $RESPONSE"
    fi
else
    print_info "Demo file not found, skipping upload test"
fi

# Test 6: Error handling
print_info "Testing error handling..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/video/generate" \
  -H "content-type: application/json" \
  -d '{"demoFile":"nonexistent.mp4","text":"Error test"}')

if echo "$RESPONSE" | grep -q "DEMO_FILE_NOT_FOUND"; then
    print_status 0 "Error handling passed"
else
    print_status 1 "Error handling failed: $RESPONSE"
fi

echo ""
echo "🎉 All smoke tests completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run production tests: BASE_URL=$PROD_BASE_URL ./scripts/smoke-tests.sh"
echo "2. Check Vercel logs: vercel logs --follow"
echo "3. Monitor error rates in production"
