#!/bin/bash

# Build Orchestration Script for BusinessAI Analytics Platform
# Coordinates building all services in the correct order with dependency handling

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build status tracking (using temp file for compatibility)
FAILED_SERVICES=()
SUCCESSFUL_SERVICES=()

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

# Function to build Java service
build_java_service() {
    local service_name=$1
    local service_path=$2
    
    log "Building Java service: ${service_name}"
    
    if [ ! -d "${service_path}" ]; then
        log_error "Service directory not found: ${service_path}"
        FAILED_SERVICES+=("${service_name}")
        return 1
    fi
    
    cd "${service_path}"
    
    # Clean and compile
    if ! mvn clean compile --no-transfer-progress -q; then
        log_error "Compilation failed for ${service_name}"
        FAILED_SERVICES+=("${service_name}")
        cd - > /dev/null
        return 1
    fi
    
    # Run tests
    if ! mvn test -Pcoverage --no-transfer-progress -q; then
        log_warning "Tests failed for ${service_name} (continuing build)"
    fi
    
    # Package
    if ! mvn package -DskipTests --no-transfer-progress -q; then
        log_error "Packaging failed for ${service_name}"
        FAILED_SERVICES+=("${service_name}")
        cd - > /dev/null
        return 1
    fi
    
    log_success "Successfully built ${service_name}"
    SUCCESSFUL_SERVICES+=("${service_name}")
    cd - > /dev/null
    return 0
}

# Function to build frontend
build_frontend() {
    log "Building Frontend Application"
    
    if [ ! -d "frontend" ]; then
        log_error "Frontend directory not found"
        FAILED_SERVICES+=("frontend")
        return 1
    fi
    
    cd frontend
    
    # Install dependencies
    if ! npm ci --silent; then
        log_error "Frontend dependency installation failed"
        FAILED_SERVICES+=("frontend")
        cd - > /dev/null
        return 1
    fi
    
    # Type check
    if ! npm run type-check; then
        log_warning "Frontend type check failed (continuing build)"
    fi
    
    # Run tests
    if ! npx vitest run --coverage --silent; then
        log_warning "Frontend tests failed (continuing build)"
    fi
    
    # Build
    if ! npm run build; then
        log_error "Frontend build failed"
        FAILED_SERVICES+=("frontend")
        cd - > /dev/null
        return 1
    fi
    
    log_success "Successfully built Frontend"
    SUCCESSFUL_SERVICES+=("frontend")
    cd - > /dev/null
    return 0
}

# Function to build AI service
build_ai_service() {
    log "Building AI Service"
    
    if [ ! -d "ai-service" ]; then
        log_error "AI Service directory not found"
        FAILED_SERVICES+=("ai-service")
        return 1
    fi
    
    cd ai-service
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
        log "Creating virtual environment for AI Service"
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    elif [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    # Install dependencies
    if ! pip install -r requirements.txt --quiet; then
        log_error "AI Service dependency installation failed"
        FAILED_SERVICES+=("ai-service")
        deactivate 2>/dev/null || true
        cd - > /dev/null
        return 1
    fi
    
    # Run tests
    if ! pytest --cov=. --cov-report=xml --cov-config=.coveragerc -q; then
        log_warning "AI Service tests failed (continuing build)"
    fi
    
    log_success "Successfully built AI Service"
    SUCCESSFUL_SERVICES+=("ai-service")
    
    deactivate 2>/dev/null || true
    cd - > /dev/null
    return 0
}

# Function to print build summary
print_summary() {
    echo ""
    echo "=========================================="
    echo "         BUILD SUMMARY"
    echo "=========================================="
    echo ""
    
    if [ ${#SUCCESSFUL_SERVICES[@]} -gt 0 ]; then
        log_success "Successful builds (${#SUCCESSFUL_SERVICES[@]}):"
        for service in "${SUCCESSFUL_SERVICES[@]}"; do
            echo "  ✓ ${service}"
        done
        echo ""
    fi
    
    if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
        log_error "Failed builds (${#FAILED_SERVICES[@]}):"
        for service in "${FAILED_SERVICES[@]}"; do
            echo "  ✗ ${service}"
        done
        echo ""
    fi
    
    local total=$((${#SUCCESSFUL_SERVICES[@]} + ${#FAILED_SERVICES[@]}))
    echo "Total: ${#SUCCESSFUL_SERVICES[@]}/${total} services built successfully"
    echo "=========================================="
}

# Main build orchestration
main() {
    log "Starting multi-service build orchestration"
    echo ""
    
    # Store the root directory
    ROOT_DIR=$(pwd)
    
    # Build order (respecting dependencies):
    # 1. API Gateway (no dependencies on other services)
    # 2. Core services (can be built in parallel, but we'll do sequential for simplicity)
    # 3. Frontend (depends on backend APIs being available)
    # 4. AI Service (independent)
    
    # Build Java services
    build_java_service "api-gateway" "${ROOT_DIR}/api-gateway"
    build_java_service "customer-service" "${ROOT_DIR}/customer-service"
    build_java_service "product-service" "${ROOT_DIR}/product-service"
    build_java_service "sales-service" "${ROOT_DIR}/sales-service"
    build_java_service "analytics-service" "${ROOT_DIR}/analytics-service"
    build_java_service "document-service" "${ROOT_DIR}/document-service"
    
    # Build frontend
    build_frontend
    
    # Build AI service
    build_ai_service
    
    # Print summary
    print_summary
    
    # Exit with error if any builds failed
    if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
        exit 1
    fi
    
    log_success "All services built successfully!"
    exit 0
}

# Run main function
main
