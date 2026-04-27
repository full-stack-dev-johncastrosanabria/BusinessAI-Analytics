#!/bin/bash

################################################################################
# Test ffmpeg recording with graceful shutdown
################################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

RECORDING_FILE="$HOME/Downloads/test-recording.mp4"
FFMPEG_PIPE="/tmp/ffmpeg_test_$$"

echo -e "${YELLOW}Testing ffmpeg recording with graceful shutdown...${NC}"
echo ""

# Clean up old files
rm -f "$RECORDING_FILE" "$FFMPEG_PIPE"

# Create named pipe
mkfifo "$FFMPEG_PIPE" 2>/dev/null || true

# Keep pipe open
(sleep 999999 > "$FFMPEG_PIPE") &
PIPE_KEEPER_PID=$!

echo -e "${GREEN}Starting 10-second test recording...${NC}"

# Start recording
ffmpeg -f avfoundation \
    -capture_cursor 1 \
    -i "3:" \
    -r 30 \
    -vcodec libx264 \
    -preset ultrafast \
    -crf 23 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -vf "crop=1920:1080:0:0" \
    -y \
    "$RECORDING_FILE" \
    < "$FFMPEG_PIPE" \
    2>/tmp/ffmpeg_test.log &

RECORDING_PID=$!

sleep 2

if kill -0 "$RECORDING_PID" 2>/dev/null; then
    echo -e "${GREEN}✅ Recording started (PID: $RECORDING_PID)${NC}"
else
    echo -e "${RED}❌ Recording failed to start${NC}"
    cat /tmp/ffmpeg_test.log | tail -10
    exit 1
fi

# Record for 10 seconds
echo -e "${YELLOW}Recording for 10 seconds...${NC}"
sleep 10

# Stop gracefully
echo -e "${GREEN}Sending 'q' command to stop recording...${NC}"
echo "q" > "$FFMPEG_PIPE" 2>/dev/null || true

# Wait for ffmpeg to finish
sleep 5

# Kill pipe keeper
kill "$PIPE_KEEPER_PID" 2>/dev/null || true

# Clean up
rm -f "$FFMPEG_PIPE"

# Check result
echo ""
if [ -f "$RECORDING_FILE" ]; then
    SIZE=$(du -h "$RECORDING_FILE" | cut -f1)
    echo -e "${GREEN}✅ Video saved: $RECORDING_FILE ($SIZE)${NC}"
    
    # Verify with ffprobe
    if command -v ffprobe >/dev/null 2>&1; then
        DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$RECORDING_FILE" 2>/dev/null | cut -d. -f1)
        if [ -n "$DURATION" ]; then
            echo -e "${GREEN}✅ Video duration: ${DURATION}s - file is valid!${NC}"
            echo -e "${GREEN}✅✅✅ TEST PASSED ✅✅✅${NC}"
        else
            echo -e "${RED}❌ Could not verify video${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Video file not found${NC}"
    echo -e "${YELLOW}Last 10 lines of ffmpeg log:${NC}"
    cat /tmp/ffmpeg_test.log 2>/dev/null | tail -10
fi

echo ""
