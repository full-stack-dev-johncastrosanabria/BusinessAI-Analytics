#!/bin/bash

# Script to verify SonarQube coverage configuration
# This script checks that all coverage reports are in the correct locations
# as specified in sonar-project.properties

set -e

echo "=========================================="
echo "SonarQube Coverage Configuration Verification"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_CHECKS_PASSED=true

# Function to check if a file exists
check_file() {
    local service=$1
    local file_path=$2
    local description=$3
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✓${NC} $service: $description found at $file_path"
        ls -lh "$file_path" | awk '{print "  Size: " $5 ", Modified: " $6 " " $7 " " $8}'
        return 0
    else
        echo -e "${RED}✗${NC} $service: $description NOT found at $file_path"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

echo "1. Checking AI Service (Python) Coverage Report"
echo "   Expected: ai-service/coverage.xml"
check_file "ai-service" "ai-service/coverage.xml" "coverage.xml"
echo ""

echo "2. Checking Frontend (TypeScript/React) Coverage Report"
echo "   Expected: frontend/coverage/lcov.info"
check_file "frontend" "frontend/coverage/lcov.info" "lcov.info"
echo ""

echo "3. Checking Java Services JaCoCo Reports"
echo "   Expected: <service>/target/site/jacoco/jacoco.xml"
echo ""

JAVA_SERVICES=("api-gateway" "product-service" "customer-service" "sales-service" "analytics-service" "document-service")

for service in "${JAVA_SERVICES[@]}"; do
    check_file "$service" "$service/target/site/jacoco/jacoco.xml" "jacoco.xml"
done

echo ""
echo "=========================================="
echo "4. Verifying sonar-project.properties Configuration"
echo "=========================================="
echo ""

# Check if sonar-project.properties exists
if [ ! -f "sonar-project.properties" ]; then
    echo -e "${RED}✗${NC} sonar-project.properties not found!"
    ALL_CHECKS_PASSED=false
else
    echo -e "${GREEN}✓${NC} sonar-project.properties found"
    
    # Verify key configurations
    echo ""
    echo "Checking coverage report path configurations:"
    echo ""
    
    # AI Service
    if grep -q "ai-service.sonar.python.coverage.reportPaths=coverage.xml" sonar-project.properties; then
        echo -e "${GREEN}✓${NC} ai-service coverage path configured correctly"
    else
        echo -e "${RED}✗${NC} ai-service coverage path configuration missing or incorrect"
        ALL_CHECKS_PASSED=false
    fi
    
    # Frontend
    if grep -q "frontend.sonar.javascript.lcov.reportPaths=coverage/lcov.info" sonar-project.properties; then
        echo -e "${GREEN}✓${NC} frontend coverage path configured correctly"
    else
        echo -e "${RED}✗${NC} frontend coverage path configuration missing or incorrect"
        ALL_CHECKS_PASSED=false
    fi
    
    # Java Services
    for service in "${JAVA_SERVICES[@]}"; do
        if grep -q "${service}.sonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml" sonar-project.properties; then
            echo -e "${GREEN}✓${NC} $service coverage path configured correctly"
        else
            echo -e "${RED}✗${NC} $service coverage path configuration missing or incorrect"
            ALL_CHECKS_PASSED=false
        fi
    done
fi

echo ""
echo "=========================================="
echo "5. Checking SonarQube Scanner Installation"
echo "=========================================="
echo ""

if command -v sonar-scanner &> /dev/null; then
    echo -e "${GREEN}✓${NC} sonar-scanner is installed"
    sonar-scanner --version | head -1
else
    echo -e "${RED}✗${NC} sonar-scanner is not installed"
    echo "  Install with: brew install sonar-scanner (macOS) or download from https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/"
    ALL_CHECKS_PASSED=false
fi

echo ""
echo "=========================================="
echo "6. Checking SonarQube Environment Variables"
echo "=========================================="
echo ""

if [ -z "$SONAR_HOST_URL" ]; then
    echo -e "${YELLOW}⚠${NC} SONAR_HOST_URL environment variable not set"
    echo "  Set with: export SONAR_HOST_URL=http://localhost:9000"
    echo "  Or for SonarCloud: export SONAR_HOST_URL=https://sonarcloud.io"
else
    echo -e "${GREEN}✓${NC} SONAR_HOST_URL is set: $SONAR_HOST_URL"
fi

if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${YELLOW}⚠${NC} SONAR_TOKEN environment variable not set"
    echo "  Generate a token at your SonarQube instance and set with:"
    echo "  export SONAR_TOKEN=<your-token>"
else
    echo -e "${GREEN}✓${NC} SONAR_TOKEN is set (hidden for security)"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "To run SonarQube analysis with coverage data:"
    echo "  1. Ensure SONAR_HOST_URL and SONAR_TOKEN are set"
    echo "  2. Run: sonar-scanner"
    echo ""
    echo "Or use the orchestrator script:"
    echo "  npm run sonar:scan"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the output above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Run tests with coverage to generate reports:"
    echo "    • AI Service: cd ai-service && pytest --cov=. --cov-report=xml"
    echo "    • Frontend: cd frontend && npm run test:coverage"
    echo "    • Java Services: cd <service> && mvn clean test"
    exit 1
fi
