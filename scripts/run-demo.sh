#!/bin/bash

################################################################################
# BusinessAI-Analytics Platform - Automated YouTube Demo
# Uses ffmpeg for reliable screen recording
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

RECORDING_FILE="$HOME/Downloads/demo.mp4"
RECORDING_PID=""

log_header() { echo -e "${PURPLE}════════════════════════════════════════════════════════════${NC}\n${PURPLE}$1${NC}\n${PURPLE}════════════════════════════════════════════════════════════${NC}\n"; }
log_step()   { echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n${CYAN}$1${NC}\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"; }
log_ok()     { echo -e "${GREEN}✅ $1${NC}"; }
log_err()    { echo -e "${RED}❌ $1${NC}"; }
log_warn()   { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_info()   { echo -e "${BLUE}ℹ️  $1${NC}"; }

cleanup() {
    echo ""
    log_warn "Cleaning up..."
    
    # Clean up ffmpeg and pipe
    [ -n "$RECORDING_PID" ] && kill -SIGTERM "$RECORDING_PID" 2>/dev/null || true
    [ -f /tmp/demo_pipe_keeper.pid ] && kill $(cat /tmp/demo_pipe_keeper.pid) 2>/dev/null || true
    
    pkill -SIGTERM -f "ffmpeg.*avfoundation" 2>/dev/null || true
    rm -f /tmp/ffmpeg_input_* /tmp/demo_recording.pid /tmp/demo_pipe_keeper.pid
    
    ./stop-system.sh 2>/dev/null || true
}
trap cleanup EXIT

################################################################################
log_header "🎬 BusinessAI-Analytics - YouTube Demo"

################################################################################
log_step "STEP 1: Stop All Systems"

./stop-system.sh --force 2>&1 | tail -3
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "python.*main.py" 2>/dev/null || true
pkill -f "java.*jar" 2>/dev/null || true
sleep 2
log_ok "All systems stopped"

################################################################################
log_step "STEP 2: Setup Database"

if ! pgrep -x mysqld > /dev/null; then
    brew services start mysql 2>/dev/null || true
    sleep 5
fi
export MYSQL_PASSWORD=Cnzmws67
mysql -u root -pCnzmws67 -e "CREATE DATABASE IF NOT EXISTS businessai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
log_ok "Database ready"

################################################################################
log_step "STEP 3: Start All Systems"

export MYSQL_PASSWORD=Cnzmws67
./start-system.sh 2>&1 | tail -10
log_info "Waiting for services to start..."
sleep 15
log_ok "Systems started"

################################################################################
log_step "STEP 4: Verify Systems"

# Retry logic for services
MAX_RETRIES=5
RETRY_DELAY=3

log_info "Verifying API Gateway..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        log_ok "API Gateway OK"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        log_err "API Gateway not responding after $MAX_RETRIES attempts"
        exit 1
    fi
    log_warn "API Gateway not ready, retrying ($i/$MAX_RETRIES)..."
    sleep $RETRY_DELAY
done

log_info "Verifying Frontend..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        log_ok "Frontend OK"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        log_err "Frontend not available after $MAX_RETRIES attempts"
        exit 1
    fi
    log_warn "Frontend not ready, retrying ($i/$MAX_RETRIES)..."
    sleep $RETRY_DELAY
done

log_info "Verifying AI Service..."
for i in $(seq 1 $MAX_RETRIES); do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_ok "AI Service OK"
        break
    fi
    if [ $i -eq $MAX_RETRIES ]; then
        log_warn "AI Service not responding (will continue anyway)"
        break
    fi
    log_warn "AI Service not ready, retrying ($i/$MAX_RETRIES)..."
    sleep $RETRY_DELAY
done

################################################################################
log_step "STEP 5: Start Screen Recording (ffmpeg)"

# Remove old file
rm -f "$RECORDING_FILE"

# Use standard Full HD resolution
RECORD_WIDTH=1920
RECORD_HEIGHT=1080
log_info "Recording resolution: ${RECORD_WIDTH}x${RECORD_HEIGHT} (Full HD)"

# Create a named pipe for sending commands to ffmpeg
FFMPEG_PIPE="/tmp/ffmpeg_input_$$"
rm -f "$FFMPEG_PIPE"
mkfifo "$FFMPEG_PIPE" 2>/dev/null || true

# Start ffmpeg recording with crop filter to capture only browser window area
# -f avfoundation = macOS screen capture
# "3:" = screen capture device
# -r 30 = 30fps
# -vcodec libx264 = H.264 video
# -preset ultrafast = fast encoding
# -crf 23 = quality
# -pix_fmt yuv420p = compatible pixel format
# -vf crop = crop to browser window size from top-left
# -movflags +faststart = enable streaming and proper MP4 finalization
log_info "Starting ffmpeg video recording..."

# Keep the pipe open in background
(sleep 999999 > "$FFMPEG_PIPE") &
PIPE_KEEPER_PID=$!

ffmpeg -f avfoundation \
    -capture_cursor 1 \
    -i "3:" \
    -r 30 \
    -vcodec libx264 \
    -preset ultrafast \
    -crf 23 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -vf "crop=${RECORD_WIDTH}:${RECORD_HEIGHT}:0:0" \
    -y \
    "$RECORDING_FILE" \
    < "$FFMPEG_PIPE" \
    2>/tmp/ffmpeg_recording.log &

RECORDING_PID=$!
echo "$RECORDING_PID" > /tmp/demo_recording.pid
echo "$PIPE_KEEPER_PID" > /tmp/demo_pipe_keeper.pid

sleep 4

if kill -0 "$RECORDING_PID" 2>/dev/null; then
    log_ok "Video recording started (PID: $RECORDING_PID)"
    log_info "Recording to: $RECORDING_FILE"
else
    log_err "ffmpeg failed to start. Check /tmp/ffmpeg_recording.log"
    cat /tmp/ffmpeg_recording.log 2>/dev/null | tail -10
    log_warn "Continuing demo without recording..."
fi
echo ""

################################################################################
log_step "STEP 6: Run Demo"

log_info "Launching browser automation..."
echo ""

if ! npx ts-node --project tsconfig.demo.json demo-interactive.ts; then
    log_err "Demo script failed!"
    exit 1
fi

echo ""
log_ok "Demo completed"
echo ""

################################################################################
log_step "STEP 7: Stop Recording"

log_info "Stopping ffmpeg recording gracefully..."

FFMPEG_PIPE="/tmp/ffmpeg_input_$$"

if [ -f /tmp/demo_recording.pid ]; then
    RECORD_PID=$(cat /tmp/demo_recording.pid)
    
    # Send 'q' to ffmpeg through the named pipe for graceful shutdown
    # This allows ffmpeg to finalize the MP4 file properly
    if [ -p "$FFMPEG_PIPE" ]; then
        log_info "Sending 'q' command to ffmpeg..."
        echo "q" > "$FFMPEG_PIPE" 2>/dev/null || true
        sleep 2
    fi
    
    # If still running after 5 seconds, send SIGTERM (gentler than SIGINT)
    sleep 3
    if kill -0 "$RECORD_PID" 2>/dev/null; then
        log_info "Sending SIGTERM to ffmpeg..."
        kill -SIGTERM "$RECORD_PID" 2>/dev/null || true
        sleep 5
    fi
    
    # If STILL running, force with SIGKILL
    if kill -0 "$RECORD_PID" 2>/dev/null; then
        log_warn "Force stopping ffmpeg..."
        kill -SIGKILL "$RECORD_PID" 2>/dev/null || true
    fi
    
    # Clean up pipe keeper process
    if [ -f /tmp/demo_pipe_keeper.pid ]; then
        PIPE_KEEPER_PID=$(cat /tmp/demo_pipe_keeper.pid)
        kill "$PIPE_KEEPER_PID" 2>/dev/null || true
        rm -f /tmp/demo_pipe_keeper.pid
    fi
    
    rm -f /tmp/demo_recording.pid "$FFMPEG_PIPE"
fi

# Also try pkill as backup
pkill -SIGTERM -f "ffmpeg.*avfoundation" 2>/dev/null || true

log_info "Waiting for video to finalize (15 seconds)..."
sleep 15

if [ -f "$RECORDING_FILE" ]; then
    SIZE=$(du -h "$RECORDING_FILE" | cut -f1)
    log_ok "Video saved: $RECORDING_FILE ($SIZE)"
    
    # Verify the video is playable
    if command -v ffprobe >/dev/null 2>&1; then
        DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$RECORDING_FILE" 2>/dev/null | cut -d. -f1)
        if [ -n "$DURATION" ]; then
            log_ok "Video duration: ${DURATION}s - file is valid!"
        else
            log_warn "Could not verify video duration"
        fi
    fi
else
    log_warn "Video file not found - check /tmp/ffmpeg_recording.log"
    log_info "Last 10 lines of ffmpeg log:"
    cat /tmp/ffmpeg_recording.log 2>/dev/null | tail -10
fi
echo ""

################################################################################
log_step "STEP 8: Stop All Systems"

./stop-system.sh 2>&1 | tail -3
echo ""

################################################################################
log_header "🎬 DONE!"

if [ -f "$RECORDING_FILE" ]; then
    SIZE=$(du -h "$RECORDING_FILE" | cut -f1)
    log_ok "Video: $RECORDING_FILE ($SIZE)"
    log_ok "Ready to upload to YouTube!"
else
    log_warn "No video file found in Downloads"
fi
