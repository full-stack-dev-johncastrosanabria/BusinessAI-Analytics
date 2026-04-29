#!/bin/bash

################################################################################
# BusinessAI-Analytics Platform Startup Script
#
# This script starts all services in the correct order:
# 1. Database verification
# 2. Backend microservices (Product, Customer, Sales, Analytics, Document)
# 3. API Gateway
# 4. AI Service
# 5. Frontend
#
# Usage:
#   ./start-system.sh              # Start all services
#   ./start-system.sh --skip-db    # Skip database check
#   ./start-system.sh --help       # Show help
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SKIP_DB_CHECK=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"  # Project root is one level up from scripts/
LOG_DIR="$SCRIPT_DIR/logs"
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_DATABASE="businessai"

# Service ports
PORT_PRODUCT=8081
PORT_CUSTOMER=8082
PORT_SALES=8083
PORT_ANALYTICS=8084
PORT_DOCUMENT=8085
PORT_GATEWAY=8080
PORT_AI=8000
PORT_FRONTEND=5173

# PIDs file to track running services
PIDS_FILE="$LOG_DIR/service_pids.txt"

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

show_help() {
    cat << EOF
BusinessAI-Analytics Platform Startup Script

Usage: $0 [OPTIONS]

Options:
    --skip-db       Skip database connectivity check
    --help          Show this help message

Environment Variables:
    MYSQL_USER      MySQL username (default: root)
    MYSQL_PASSWORD  MySQL password (default: empty)

Examples:
    $0                          # Start all services
    $0 --skip-db                # Skip database check
    MYSQL_PASSWORD=secret $0    # Start with custom MySQL password

Services Started:
    - Product Service (port $PORT_PRODUCT)
    - Customer Service (port $PORT_CUSTOMER)
    - Sales Service (port $PORT_SALES)
    - Analytics Service (port $PORT_ANALYTICS)
    - Document Service (port $PORT_DOCUMENT)
    - API Gateway (port $PORT_GATEWAY)
    - AI Service (port $PORT_AI)
    - Frontend (port $PORT_FRONTEND)

Logs:
    All service logs are stored in: $LOG_DIR/

Stop Services:
    Use ./stop-system.sh or press Ctrl+C

EOF
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_deps=()
    
    # Check Java
    if ! command -v java &> /dev/null; then
        missing_deps+=("Java 17")
    else
        java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
        if [ "$java_version" -lt 17 ]; then
            print_warning "Java version $java_version found, but Java 17+ is required"
            missing_deps+=("Java 17+")
        else
            print_success "Java $java_version found"
        fi
    fi
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        missing_deps+=("Maven")
    else
        print_success "Maven found"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js 18+")
    else
        node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            print_warning "Node.js version $node_version found, but Node.js 18+ is required"
            missing_deps+=("Node.js 18+")
        else
            print_success "Node.js $(node -v) found"
        fi
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("Python 3.9+")
    else
        python_version=$(python3 --version | awk '{print $2}' | cut -d'.' -f1,2)
        print_success "Python $(python3 --version | awk '{print $2}') found"
    fi
    
    # Check MySQL
    if ! command -v mysql &> /dev/null; then
        missing_deps+=("MySQL 8.0")
    else
        print_success "MySQL found"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing prerequisites:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
    
    echo ""
}

check_database() {
    if [ "$SKIP_DB_CHECK" = true ]; then
        print_warning "Skipping database check"
        return 0
    fi
    
    print_header "Checking Database"
    
    # Check if MySQL is running
    if ! pgrep -x mysqld > /dev/null && ! pgrep -x mysql > /dev/null; then
        print_error "MySQL is not running. Please start MySQL first."
        exit 1
    fi
    print_success "MySQL is running"
    
    # Check database connection
    if [ -z "$MYSQL_PASSWORD" ]; then
        mysql_cmd="mysql -u $MYSQL_USER"
    else
        mysql_cmd="mysql -u $MYSQL_USER -p$MYSQL_PASSWORD"
    fi
    
    if ! $mysql_cmd -e "USE $MYSQL_DATABASE;" 2>/dev/null; then
        print_error "Database '$MYSQL_DATABASE' does not exist or cannot connect"
        print_info "Run: mysql -u $MYSQL_USER -p < database/schema.sql"
        exit 1
    fi
    print_success "Database '$MYSQL_DATABASE' is accessible"
    
    echo ""
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

wait_for_service() {
    local service_name=$1
    local port=$2
    local max_wait=${3:-60}
    local wait_time=0
    
    print_info "Waiting for $service_name to start on port $port..."
    
    while [ $wait_time -lt $max_wait ]; do
        if check_port $port; then
            print_success "$service_name is ready on port $port"
            return 0
        fi
        sleep 2
        wait_time=$((wait_time + 2))
    done
    
    print_error "$service_name failed to start within ${max_wait}s"
    return 1
}

start_spring_service() {
    local service_name=$1
    local service_dir=$2
    local port=$3
    
    print_info "Starting $service_name..."
    
    if check_port $port; then
        print_warning "$service_name already running on port $port"
        return 0
    fi
    
    cd "$ROOT_DIR/$service_dir"
    
    # Start service in background
    nohup mvn spring-boot:run > "$LOG_DIR/${service_name}.log" 2>&1 &
    local pid=$!
    echo "$service_name:$pid" >> "$PIDS_FILE"
    
    cd "$ROOT_DIR"
    
    # Wait for service to be ready
    if wait_for_service "$service_name" "$port" 90; then
        print_success "$service_name started (PID: $pid)"
        return 0
    else
        print_error "$service_name failed to start. Check $LOG_DIR/${service_name}.log"
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-db)
            SKIP_DB_CHECK=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Create logs directory
mkdir -p "$LOG_DIR"

# Clear previous PIDs file
> "$PIDS_FILE"

print_header "BusinessAI-Analytics Platform Startup"
echo "Starting all services..."
echo ""

# Check prerequisites
check_prerequisites

# Check database
check_database

# Start backend microservices
print_header "Starting Backend Microservices"

start_spring_service "Product Service" "product-service" $PORT_PRODUCT || exit 1
start_spring_service "Customer Service" "customer-service" $PORT_CUSTOMER || exit 1
start_spring_service "Sales Service" "sales-service" $PORT_SALES || exit 1
start_spring_service "Analytics Service" "analytics-service" $PORT_ANALYTICS || exit 1
start_spring_service "Document Service" "document-service" $PORT_DOCUMENT || exit 1

echo ""

# Start API Gateway
print_header "Starting API Gateway"
start_spring_service "API Gateway" "api-gateway" $PORT_GATEWAY || exit 1

echo ""

# Start AI Service
print_header "Starting AI Service"

if check_port $PORT_AI; then
    print_warning "AI Service already running on port $PORT_AI"
else
    print_info "Starting AI Service..."
    
    cd "$ROOT_DIR/ai-service"
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment and install dependencies
    source .venv/bin/activate
    
    if [ ! -f ".venv/installed" ]; then
        print_info "Installing Python dependencies..."
        pip install -q -r requirements.txt
        touch .venv/installed
    fi
    
    # Check if models are trained
    if [ ! -d "trained_models" ] || [ ! -f "trained_models/sales_forecast_model.pt" ]; then
        print_warning "AI models not found. Training models..."
        MYSQL_PASSWORD="$MYSQL_PASSWORD" python train_models.py
    fi
    
    # Start AI service with MySQL password
    MYSQL_PASSWORD="$MYSQL_PASSWORD" nohup python main.py > "$LOG_DIR/ai-service.log" 2>&1 &
    ai_pid=$!
    echo "AI Service:$ai_pid" >> "$PIDS_FILE"
    
    cd "$ROOT_DIR"
    
    if wait_for_service "AI Service" "$PORT_AI" 60; then
        print_success "AI Service started (PID: $ai_pid)"
    else
        print_error "AI Service failed to start. Check $LOG_DIR/ai-service.log"
        exit 1
    fi
fi

echo ""

# Start Frontend
print_header "Starting Frontend"

if check_port $PORT_FRONTEND; then
    print_warning "Frontend already running on port $PORT_FRONTEND"
else
    print_info "Starting Frontend..."
    
    cd "$ROOT_DIR/frontend"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing Node.js dependencies..."
        npm install --silent
    fi
    
    # Start frontend
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    frontend_pid=$!
    echo "Frontend:$frontend_pid" >> "$PIDS_FILE"
    
    cd "$ROOT_DIR"
    
    if wait_for_service "Frontend" "$PORT_FRONTEND" 60; then
        print_success "Frontend started (PID: $frontend_pid)"
    else
        print_error "Frontend failed to start. Check $LOG_DIR/frontend.log"
        exit 1
    fi
fi

echo ""

# Summary
print_header "System Started Successfully"
echo ""
echo "All services are running:"
echo ""
echo "  Frontend:          http://localhost:$PORT_FRONTEND"
echo "  API Gateway:       http://localhost:$PORT_GATEWAY"
echo "  Product Service:   http://localhost:$PORT_PRODUCT"
echo "  Customer Service:  http://localhost:$PORT_CUSTOMER"
echo "  Sales Service:     http://localhost:$PORT_SALES"
echo "  Analytics Service: http://localhost:$PORT_ANALYTICS"
echo "  Document Service:  http://localhost:$PORT_DOCUMENT"
echo "  AI Service:        http://localhost:$PORT_AI"
echo ""
echo "Logs are available in: $LOG_DIR/"
echo ""
echo "To stop all services, run: ./stop-system.sh"
echo "Or press Ctrl+C to stop this script (services will continue running)"
echo ""

print_success "System is ready!"
