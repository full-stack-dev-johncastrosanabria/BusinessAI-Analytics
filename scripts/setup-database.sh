#!/bin/bash

################################################################################
# BusinessAI-Analytics Database Setup Script
#
# This script sets up the MySQL database with schema and seed data
#
# Usage:
#   ./setup-database.sh
#   ./setup-database.sh --skip-seed    # Skip loading seed data
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MYSQL_USER="${MYSQL_USER:-root}"
MYSQL_PASSWORD="${MYSQL_PASSWORD:-}"
MYSQL_DATABASE="businessai"
SKIP_SEED=false

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
BusinessAI-Analytics Database Setup Script

Usage: $0 [OPTIONS]

Options:
    --skip-seed    Skip loading seed data
    --help         Show this help message

Environment Variables:
    MYSQL_USER      MySQL username (default: root)
    MYSQL_PASSWORD  MySQL password (default: empty)

Examples:
    $0                          # Setup database with seed data
    $0 --skip-seed              # Setup database without seed data
    MYSQL_PASSWORD=secret $0    # Setup with custom password

EOF
}

################################################################################
# Main Execution
################################################################################

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-seed)
            SKIP_SEED=true
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

print_header "BusinessAI-Analytics Database Setup"
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    print_error "MySQL is not installed"
    echo ""
    echo "Install MySQL:"
    echo "  macOS:  brew install mysql"
    echo "  Ubuntu: sudo apt-get install mysql-server"
    echo "  CentOS: sudo yum install mysql-server"
    exit 1
fi

print_success "MySQL is installed"

# Check if MySQL is running
if ! pgrep -x mysqld > /dev/null && ! pgrep -x mysql > /dev/null; then
    print_error "MySQL is not running"
    echo ""
    echo "Start MySQL:"
    echo "  macOS:  brew services start mysql"
    echo "  Ubuntu: sudo systemctl start mysql"
    echo "  CentOS: sudo systemctl start mysqld"
    exit 1
fi

print_success "MySQL is running"
echo ""

# Build MySQL command
if [ -z "$MYSQL_PASSWORD" ]; then
    mysql_cmd="mysql -u $MYSQL_USER"
    print_info "Connecting to MySQL as user: $MYSQL_USER (no password)"
else
    mysql_cmd="mysql -u $MYSQL_USER -p$MYSQL_PASSWORD"
    print_info "Connecting to MySQL as user: $MYSQL_USER (with password)"
fi

echo ""

# Test MySQL connection
print_info "Testing MySQL connection..."
if ! $mysql_cmd -e "SELECT 1;" > /dev/null 2>&1; then
    print_error "Cannot connect to MySQL"
    echo ""
    echo "Please check:"
    echo "  1. MySQL username is correct (current: $MYSQL_USER)"
    echo "  2. MySQL password is correct"
    echo "  3. MySQL is accessible"
    echo ""
    echo "Set password with: export MYSQL_PASSWORD=your_password"
    exit 1
fi

print_success "MySQL connection successful"
echo ""

# Check if database exists
print_info "Checking if database '$MYSQL_DATABASE' exists..."
if $mysql_cmd -e "USE $MYSQL_DATABASE;" 2>/dev/null; then
    print_warning "Database '$MYSQL_DATABASE' already exists"
    echo ""
    read -p "Do you want to recreate it? This will DELETE all existing data! (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Database setup cancelled"
        exit 0
    fi
    
    print_info "Dropping existing database..."
    $mysql_cmd -e "DROP DATABASE $MYSQL_DATABASE;"
    print_success "Database dropped"
fi

echo ""

# Create database and load schema
print_header "Creating Database Schema"
echo ""

if [ ! -f "database/schema.sql" ]; then
    print_error "Schema file not found: database/schema.sql"
    exit 1
fi

print_info "Creating database '$MYSQL_DATABASE'..."
$mysql_cmd -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
print_success "Database created"

echo ""
print_info "Loading schema from database/schema.sql..."
if $mysql_cmd $MYSQL_DATABASE < database/schema.sql; then
    print_success "Database schema created successfully"
else
    print_error "Failed to create database schema"
    exit 1
fi

echo ""

# Verify tables were created
print_info "Verifying tables..."
table_count=$($mysql_cmd -N -e "USE $MYSQL_DATABASE; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$MYSQL_DATABASE';")

if [ "$table_count" -gt 0 ]; then
    print_success "Found $table_count tables"
    
    # List tables
    echo ""
    print_info "Tables created:"
    $mysql_cmd -e "USE $MYSQL_DATABASE; SHOW TABLES;" | tail -n +2 | while read table; do
        echo "  - $table"
    done
else
    print_error "No tables found in database"
    exit 1
fi

echo ""

# Load seed data
if [ "$SKIP_SEED" = false ]; then
    print_header "Loading Seed Data"
    echo ""
    
    if [ ! -f "database/seed_data.sql" ]; then
        print_warning "Seed data file not found: database/seed_data.sql"
        print_info "Skipping seed data"
    else
        print_info "Loading seed data from database/seed_data.sql..."
        if $mysql_cmd $MYSQL_DATABASE < database/seed_data.sql; then
            print_success "Seed data loaded successfully"
            
            # Show data counts
            echo ""
            print_info "Data loaded:"
            
            products=$($mysql_cmd -N -e "USE $MYSQL_DATABASE; SELECT COUNT(*) FROM products;")
            customers=$($mysql_cmd -N -e "USE $MYSQL_DATABASE; SELECT COUNT(*) FROM customers;")
            transactions=$($mysql_cmd -N -e "USE $MYSQL_DATABASE; SELECT COUNT(*) FROM sales_transactions;")
            metrics=$($mysql_cmd -N -e "USE $MYSQL_DATABASE; SELECT COUNT(*) FROM business_metrics;")
            
            echo "  - Products: $products"
            echo "  - Customers: $customers"
            echo "  - Sales Transactions: $transactions"
            echo "  - Business Metrics: $metrics"
        else
            print_error "Failed to load seed data"
            exit 1
        fi
    fi
else
    print_warning "Skipping seed data (--skip-seed flag)"
fi

echo ""

# Summary
print_header "Database Setup Complete"
echo ""
print_success "Database '$MYSQL_DATABASE' is ready!"
echo ""
echo "Connection details:"
echo "  Host:     localhost"
echo "  Database: $MYSQL_DATABASE"
echo "  User:     $MYSQL_USER"
echo ""
echo "Next steps:"
echo "  1. Start the system:  ./start-system.sh"
echo "  2. Check status:      ./check-system.sh"
echo "  3. Access frontend:   http://localhost:5173"
echo ""
