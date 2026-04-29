#!/bin/bash

################################################################################
# BusinessAI-Analytics Platform Stop Script
#
# This script stops all running services started by start-system.sh
#
# Usage:
#   ./stop-system.sh              # Stop all services
#   ./stop-system.sh --force      # Force kill all services
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PIDS_FILE="$LOG_DIR/service_pids.txt"
FORCE_KILL=false

# Service ports
PORTS=(8081 8082 8083 8084 8085 8080 8000 5173)
SERVICE_NAMES=("Product Service" "Customer Service" "Sales Service" "Analytics Service" "Document Service" "API Gateway" "AI Service" "Frontend")

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

stop_service_by_pid() {
    local service_name=$1
    local pid=$2
    
    if [ -z "$pid" ]; then
        return 1
    fi
    
    # Check if process exists
    if ! ps -p $pid > /dev/null 2>&1; then
        print_warning "$service_name (PID: $pid) is not running"
        return 0
    fi
    
    print_info "Stopping $service_name (PID: $pid)..."
    
    if [ "$FORCE_KILL" = true ]; then
        kill -9 $pid 2>/dev/null
    else
        kill $pid 2>/dev/null
        
        # Wait for graceful shutdown (max 10 seconds)
        local wait_time=0
        while ps -p $pid > /dev/null 2>&1 && [ $wait_time -lt 10 ]; do
            sleep 1
            wait_time=$((wait_time + 1))
        done
        
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            print_warning "Graceful shutdown failed, force killing..."
            kill -9 $pid 2>/dev/null
        fi
    fi
    
    # Verify process is stopped
    if ! ps -p $pid > /dev/null 2>&1; then
        print_success "$service_name stopped"
        return 0
    else
        print_error "Failed to stop $service_name"
        return 1
    fi
}

stop_service_by_port() {
    local service_name=$1
    local port=$2
    
    # Find PID using the port
    local pid=$(lsof -ti:$port 2>/dev/null)
    
    if [ -z "$pid" ]; then
        return 0
    fi
    
    print_info "Found $service_name on port $port (PID: $pid)"
    stop_service_by_pid "$service_name" "$pid"
}

################################################################################
# Main Execution
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_KILL=true
            shift
            ;;
        --help)
            cat << EOF
BusinessAI-Analytics Platform Stop Script

Usage: $0 [OPTIONS]

Options:
    --force    Force kill all services (SIGKILL instead of SIGTERM)
    --help     Show this help message

Examples:
    $0           # Gracefully stop all services
    $0 --force   # Force kill all services

EOF
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_header "BusinessAI-Analytics Platform Shutdown"

if [ "$FORCE_KILL" = true ]; then
    print_warning "Force kill mode enabled"
fi

echo ""

# Stop services from PIDs file if it exists
if [ -f "$PIDS_FILE" ]; then
    print_info "Stopping services from PIDs file..."
    
    while IFS=: read -r service_name pid; do
        stop_service_by_pid "$service_name" "$pid"
    done < "$PIDS_FILE"
    
    # Remove PIDs file
    rm -f "$PIDS_FILE"
    echo ""
fi

# Stop any remaining services by port
print_info "Checking for services on known ports..."
echo ""

for i in "${!PORTS[@]}"; do
    stop_service_by_port "${SERVICE_NAMES[$i]}" "${PORTS[$i]}"
done

echo ""

# Check if any services are still running
print_info "Verifying all services are stopped..."
echo ""

all_stopped=true
for i in "${!PORTS[@]}"; do
    if lsof -Pi :${PORTS[$i]} -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "${SERVICE_NAMES[$i]} still running on port ${PORTS[$i]}"
        all_stopped=false
    fi
done

echo ""

if [ "$all_stopped" = true ]; then
    print_success "All services stopped successfully"
else
    print_warning "Some services may still be running"
    print_info "Run with --force flag to force kill: ./stop-system.sh --force"
fi

echo ""
print_header "Shutdown Complete"
