#!/bin/bash

################################################################################
# BusinessAI-Analytics Platform Status Check Script
#
# This script checks the status of all services
#
# Usage:
#   ./check-system.sh
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Service names and ports (parallel arrays)
SERVICE_NAMES=("Product Service" "Customer Service" "Sales Service" "Analytics Service" "Document Service" "API Gateway" "AI Service" "Frontend")
SERVICE_PORTS=(8081 8082 8083 8084 8085 8080 8000 5173)

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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_service() {
    local service_name=$1
    local port=$2
    
    # Check if port is listening
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -ti:$port 2>/dev/null | head -1)
        printf "%-25s ${GREEN}RUNNING${NC}  (port: %5s, PID: %s)\n" "$service_name" "$port" "$pid"
        return 0
    else
        printf "%-25s ${RED}STOPPED${NC}  (port: %5s)\n" "$service_name" "$port"
        return 1
    fi
}

check_database() {
    local mysql_user="${MYSQL_USER:-root}"
    local mysql_password="${MYSQL_PASSWORD:-}"
    local mysql_database="businessai"
    
    if [ -z "$mysql_password" ]; then
        mysql_cmd="mysql -u $mysql_user"
    else
        mysql_cmd="mysql -u $mysql_user -p$mysql_password"
    fi
    
    if $mysql_cmd -e "USE $mysql_database;" 2>/dev/null; then
        printf "%-25s ${GREEN}ACCESSIBLE${NC}\n" "MySQL Database"
        return 0
    else
        printf "%-25s ${RED}NOT ACCESSIBLE${NC}\n" "MySQL Database"
        return 1
    fi
}

check_health_endpoint() {
    local service_name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

################################################################################
# Main Execution
################################################################################

print_header "BusinessAI-Analytics Platform Status"
echo ""

# Check database
print_info "Database Status:"
check_database
echo ""

# Check all services
print_info "Service Status:"

running_count=0
total_count=${#SERVICE_NAMES[@]}

# Check each service
for i in "${!SERVICE_NAMES[@]}"; do
    service_name="${SERVICE_NAMES[$i]}"
    port="${SERVICE_PORTS[$i]}"
    if check_service "$service_name" "$port"; then
        ((running_count++))
    fi
done

echo ""

# Summary
print_header "Summary"
echo ""

if [ $running_count -eq $total_count ]; then
    print_success "All services are running ($running_count/$total_count)"
    echo ""
    echo "Access the application at: http://localhost:5173"
elif [ $running_count -eq 0 ]; then
    print_error "No services are running ($running_count/$total_count)"
    echo ""
    echo "Start the system with: ./start-system.sh"
else
    echo -e "${YELLOW}⚠ Some services are not running ($running_count/$total_count)${NC}"
    echo ""
    echo "Check logs in: ./logs/"
    echo "Restart services with: ./start-system.sh"
fi

echo ""

# Check health endpoints for running services
if [ $running_count -gt 0 ]; then
    print_info "Health Check:"
    
    # Check API Gateway health
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        if check_health_endpoint "API Gateway" "http://localhost:8080/actuator/health"; then
            print_success "API Gateway health endpoint responding"
        fi
    fi
    
    # Check AI Service health
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        if check_health_endpoint "AI Service" "http://localhost:8000/health"; then
            print_success "AI Service health endpoint responding"
        fi
    fi
    
    echo ""
fi

# Show log locations
print_info "Logs:"
echo "  All service logs: ./logs/"
echo ""

# Show useful commands
print_info "Useful Commands:"
echo "  Start system:  ./start-system.sh"
echo "  Stop system:   ./stop-system.sh"
echo "  Check status:  ./check-system.sh"
echo ""
