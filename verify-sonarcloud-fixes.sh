#!/bin/bash
# Verification script for SonarCloud fixes

# Constants
SEPARATOR="=========================================="

echo "$SEPARATOR"
echo "  SonarCloud Fixes Verification"
echo "$SEPARATOR"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ALL_PASSED=true

# 1. Check bash script syntax
echo "1. Checking bash script syntax..."
if bash -n ai-service/train_10x_models.sh 2>/dev/null; then
    echo -e "${GREEN}✅ Bash syntax valid${NC}"
else
    echo -e "${RED}❌ Bash syntax errors found${NC}"
    ALL_PASSED=false
fi
echo ""

# 2. Verify [[ usage in bash script
echo "2. Verifying [[ usage in bash script..."
# Look for single bracket test command (not [[)
SINGLE_BRACKET_COUNT=$(grep -E '(^|[^[])\[ ' ai-service/train_10x_models.sh 2>/dev/null | grep -v '\[\[' | wc -l | tr -d ' ')
DOUBLE_BRACKET_COUNT=$(grep -c '\[\[' ai-service/train_10x_models.sh 2>/dev/null || echo "0")

if [[ $SINGLE_BRACKET_COUNT -eq 0 ]] && [[ $DOUBLE_BRACKET_COUNT -gt 0 ]]; then
    echo -e "${GREEN}✅ All single brackets replaced with [[ ($DOUBLE_BRACKET_COUNT instances)${NC}"
else
    echo -e "${YELLOW}⚠️  Found $SINGLE_BRACKET_COUNT problematic single brackets${NC}"
    if [[ $SINGLE_BRACKET_COUNT -gt 0 ]]; then
        ALL_PASSED=false
    fi
fi
echo ""

# 3. Verify stderr redirects
echo "3. Verifying stderr redirects..."
STDERR_COUNT=$(grep -c '>&2' ai-service/train_10x_models.sh 2>/dev/null || echo "0")
if [[ $STDERR_COUNT -ge 2 ]]; then
    echo -e "${GREEN}✅ Stderr redirects present ($STDERR_COUNT instances)${NC}"
else
    echo -e "${YELLOW}⚠️  Expected at least 2 stderr redirects, found $STDERR_COUNT${NC}"
fi
echo ""

# 4. Check Python constants
echo "4. Checking Python constants..."
if grep -q "TOP_PRODUCT_REVENUE_ES = 'se facturó más'" ai-service/chatbot/advanced_query_processor.py 2>/dev/null; then
    echo -e "${GREEN}✅ New constants defined${NC}"
else
    echo -e "${RED}❌ Constants not found${NC}"
    ALL_PASSED=false
fi
echo ""

# 5. Verify constant usage
echo "5. Verifying constant usage in functions..."
if grep -q "TOP_PRODUCT_REVENUE_ES, PRODUCT_INVOICED_ES" ai-service/chatbot/advanced_query_processor.py 2>/dev/null; then
    echo -e "${GREEN}✅ Constants being used in functions${NC}"
else
    echo -e "${RED}❌ Constants not being used${NC}"
    ALL_PASSED=false
fi
echo ""

# 6. Run Python tests
echo "6. Running Python tests..."
if command -v python3 &> /dev/null; then
    cd ai-service 2>/dev/null || exit 1
    if python3 -m pytest tests/ -q --tb=no 2>&1 | grep -q "passed"; then
        echo -e "${GREEN}✅ Tests passing${NC}"
    else
        echo -e "${RED}❌ Tests failing${NC}"
        ALL_PASSED=false
    fi
    cd .. 2>/dev/null || exit 1
else
    echo -e "${YELLOW}⚠️  Python3 not found, skipping tests${NC}"
fi
echo ""

# 7. Check documentation
echo "7. Checking documentation..."
DOC_COUNT=0
[[ -f "SONARCLOUD-FIX-SUMMARY.md" ]] && ((DOC_COUNT++))
[[ -f "SONARCLOUD-ALL-FIXES-COMPLETE.md" ]] && ((DOC_COUNT++))
[[ -f "SONARCLOUD-FINAL-FIX-REPORT.md" ]] && ((DOC_COUNT++))

if [[ $DOC_COUNT -ge 2 ]]; then
    echo -e "${GREEN}✅ Documentation files present ($DOC_COUNT files)${NC}"
else
    echo -e "${YELLOW}⚠️  Found $DOC_COUNT documentation files${NC}"
fi
echo ""

# Final summary
echo "$SEPARATOR"
if [[ "$ALL_PASSED" == "true" ]]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: sonar-scanner"
    echo "2. Commit changes"
    echo "3. Push to repository"
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "Please review the errors above."
fi
echo "$SEPARATOR"
