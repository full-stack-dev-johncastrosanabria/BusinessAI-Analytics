#!/bin/bash

# Build Status Reporting Script
# Reports overall build health and status for all services

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Service definitions
JAVA_SERVICES=("api-gateway" "customer-service" "product-service" "sales-service" "analytics-service" "document-service")
FRONTEND_SERVICE="frontend"
AI_SERVICE="ai-service"

# Status tracking (using simple variables instead of associative arrays for compatibility)
SERVICE_STATUS=""
SERVICE_ARTIFACTS=""
SERVICE_TESTS=""

# Logging functions
log_header() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  $1"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
}

log_section() {
    echo -e "\n${BLUE}▶ $1${NC}"
    echo "────────────────────────────────────────────────────────────────"
}

log_status() {
    local status=$1
    local message=$2
    
    case $status in
        "SUCCESS")
            echo -e "  ${GREEN}✓${NC} ${message}"
            ;;
        "FAILED")
            echo -e "  ${RED}✗${NC} ${message}"
            ;;
        "WARNING")
            echo -e "  ${YELLOW}⚠${NC} ${message}"
            ;;
        "INFO")
            echo -e "  ${BLUE}ℹ${NC} ${message}"
            ;;
    esac
}

# Check Java service status
check_java_service() {
    local service=$1
    local service_path=$2
    
    if [ ! -d "${service_path}" ]; then
        echo "${service}:NOT_FOUND:N/A:N/A" >> /tmp/build_status.tmp
        return 1
    fi
    
    local status="NOT_BUILT"
    local artifacts="N/A"
    local tests="N/A"
    
    # Check if JAR exists
    if [ -f "${service_path}/target/${service}-0.0.1-SNAPSHOT.jar" ] || \
       [ -f "${service_path}/target/${service}.jar" ] || \
       ls "${service_path}"/target/*.jar 1> /dev/null 2>&1; then
        status="BUILT"
        artifacts="JAR"
    fi
    
    # Check test reports
    if [ -d "${service_path}/target/surefire-reports" ]; then
        local test_count=$(find "${service_path}/target/surefire-reports" -name "TEST-*.xml" 2>/dev/null | wc -l | tr -d ' ')
        tests="${test_count} test suites"
    else
        tests="No tests found"
    fi
    
    echo "${service}:${status}:${artifacts}:${tests}" >> /tmp/build_status.tmp
}

# Check frontend status
check_frontend() {
    local status="NOT_BUILT"
    local artifacts="N/A"
    local tests="N/A"
    
    if [ ! -d "frontend" ]; then
        echo "${FRONTEND_SERVICE}:NOT_FOUND:N/A:N/A" >> /tmp/build_status.tmp
        return 1
    fi
    
    # Check if build exists
    if [ -d "frontend/dist" ] && [ "$(ls -A frontend/dist 2>/dev/null)" ]; then
        status="BUILT"
        artifacts="dist/"
    fi
    
    # Check test coverage
    if [ -d "frontend/coverage" ]; then
        tests="Coverage available"
    else
        tests="No coverage found"
    fi
    
    echo "${FRONTEND_SERVICE}:${status}:${artifacts}:${tests}" >> /tmp/build_status.tmp
}

# Check AI service status
check_ai_service() {
    local status="NOT_CONFIGURED"
    local artifacts="N/A"
    local tests="N/A"
    
    if [ ! -d "ai-service" ]; then
        echo "${AI_SERVICE}:NOT_FOUND:N/A:N/A" >> /tmp/build_status.tmp
        return 1
    fi
    
    # Check if dependencies are installed
    if [ -d "ai-service/.venv" ] || [ -d "ai-service/venv" ]; then
        status="CONFIGURED"
        artifacts="venv"
    fi
    
    # Check test coverage
    if [ -f "ai-service/coverage.xml" ] || [ -d "ai-service/htmlcov" ]; then
        tests="Coverage available"
    else
        tests="No coverage found"
    fi
    
    echo "${AI_SERVICE}:${status}:${artifacts}:${tests}" >> /tmp/build_status.tmp
}

# Check SonarQube quality gate status
check_quality_gate() {
    log_section "Quality Gate Status"
    
    if [ -n "${SONAR_TOKEN}" ] && [ -n "${SONAR_HOST_URL}" ]; then
        log_status "INFO" "SonarQube configured: ${SONAR_HOST_URL}"
        
        # Check if .scannerwork exists (indicates recent scan)
        if [ -d ".scannerwork" ]; then
            log_status "SUCCESS" "Recent SonarQube scan detected"
        else
            log_status "WARNING" "No recent SonarQube scan found"
        fi
    else
        log_status "WARNING" "SonarQube credentials not configured"
        log_status "INFO" "Set SONAR_TOKEN and SONAR_HOST_URL environment variables"
    fi
}

# Print service status
print_service_status() {
    local service=$1
    local status=$2
    local artifacts=$3
    local tests=$4
    
    case $status in
        "BUILT"|"CONFIGURED")
            log_status "SUCCESS" "${service}: Built successfully"
            echo "      Artifacts: ${artifacts}"
            echo "      Tests: ${tests}"
            ;;
        "NOT_BUILT"|"NOT_CONFIGURED")
            log_status "WARNING" "${service}: Not built"
            ;;
        "NOT_FOUND")
            log_status "FAILED" "${service}: Directory not found"
            ;;
        *)
            log_status "INFO" "${service}: Unknown status"
            ;;
    esac
}

# Calculate overall health score
calculate_health_score() {
    local total_services=0
    local healthy_services=0
    
    if [ -f /tmp/build_status.tmp ]; then
        while IFS=: read -r service status artifacts tests; do
            total_services=$((total_services + 1))
            if [ "$status" = "BUILT" ] || [ "$status" = "CONFIGURED" ]; then
                healthy_services=$((healthy_services + 1))
            fi
        done < /tmp/build_status.tmp
    fi
    
    if [ $total_services -eq 0 ]; then
        echo "0"
        return
    fi
    
    local score=$((healthy_services * 100 / total_services))
    echo "$score"
}

# Print overall summary
print_summary() {
    log_section "Overall Build Health"
    
    local health_score=$(calculate_health_score)
    
    echo ""
    echo "  Health Score: ${health_score}%"
    echo ""
    
    if [ $health_score -ge 90 ]; then
        log_status "SUCCESS" "Build health is excellent"
    elif [ $health_score -ge 70 ]; then
        log_status "WARNING" "Build health is good but could be improved"
    elif [ $health_score -ge 50 ]; then
        log_status "WARNING" "Build health needs attention"
    else
        log_status "FAILED" "Build health is poor - immediate action required"
    fi
    
    echo ""
    echo "  Services Status:"
    local built=0
    local not_built=0
    local not_found=0
    
    if [ -f /tmp/build_status.tmp ]; then
        while IFS=: read -r service status artifacts tests; do
            case $status in
                "BUILT"|"CONFIGURED")
                    built=$((built + 1))
                    ;;
                "NOT_BUILT"|"NOT_CONFIGURED")
                    not_built=$((not_built + 1))
                    ;;
                "NOT_FOUND")
                    not_found=$((not_found + 1))
                    ;;
            esac
        done < /tmp/build_status.tmp
    fi
    
    echo "    ✓ Built: ${built}"
    echo "    ⚠ Not Built: ${not_built}"
    echo "    ✗ Not Found: ${not_found}"
}

# Main function
main() {
    # Clean up temp file
    rm -f /tmp/build_status.tmp
    
    log_header "Build Status Report - $(date +'%Y-%m-%d %H:%M:%S')"
    
    # Store root directory
    ROOT_DIR=$(pwd)
    
    # Check all Java services
    log_section "Java Services Status"
    for service in "${JAVA_SERVICES[@]}"; do
        check_java_service "${service}" "${ROOT_DIR}/${service}"
    done
    
    # Print Java services status
    if [ -f /tmp/build_status.tmp ]; then
        while IFS=: read -r service status artifacts tests; do
            for java_service in "${JAVA_SERVICES[@]}"; do
                if [ "$service" = "$java_service" ]; then
                    print_service_status "${service}" "${status}" "${artifacts}" "${tests}"
                fi
            done
        done < /tmp/build_status.tmp
    fi
    
    # Check frontend
    log_section "Frontend Service Status"
    check_frontend
    
    # Print frontend status
    if [ -f /tmp/build_status.tmp ]; then
        while IFS=: read -r service status artifacts tests; do
            if [ "$service" = "$FRONTEND_SERVICE" ]; then
                print_service_status "${service}" "${status}" "${artifacts}" "${tests}"
            fi
        done < /tmp/build_status.tmp
    fi
    
    # Check AI service
    log_section "AI Service Status"
    check_ai_service
    
    # Print AI service status
    if [ -f /tmp/build_status.tmp ]; then
        while IFS=: read -r service status artifacts tests; do
            if [ "$service" = "$AI_SERVICE" ]; then
                print_service_status "${service}" "${status}" "${artifacts}" "${tests}"
            fi
        done < /tmp/build_status.tmp
    fi
    
    # Check quality gate
    check_quality_gate
    
    # Print summary
    print_summary
    
    echo ""
    log_header "End of Build Status Report"
    echo ""
    
    # Clean up
    rm -f /tmp/build_status.tmp
    
    # Exit with appropriate code
    local health_score=$(calculate_health_score)
    if [ $health_score -ge 70 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main
