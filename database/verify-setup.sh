#!/bin/bash

# Script to verify the test environment setup

echo "=== BusinessAI Database Test Environment Verification ==="
echo ""

# Check Java
echo "Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    echo "✓ Java found: $JAVA_VERSION"
else
    echo "✗ Java not found. Please install Java 17 or higher."
    exit 1
fi

# Check Maven
echo ""
echo "Checking Maven..."
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn --version | head -n 1)
    echo "✓ Maven found: $MVN_VERSION"
else
    echo "✗ Maven not found. Please install Maven 3.6 or higher."
    echo "  macOS: brew install maven"
    echo "  Linux: sudo apt-get install maven"
    exit 1
fi

# Check MySQL
echo ""
echo "Checking MySQL..."
if command -v mysql &> /dev/null; then
    MYSQL_VERSION=$(mysql --version)
    echo "✓ MySQL client found: $MYSQL_VERSION"
else
    echo "✗ MySQL client not found. Please install MySQL 8.0 or higher."
    exit 1
fi

# Check MySQL connection
echo ""
echo "Checking MySQL connection..."
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-}

if [ -z "$DB_PASSWORD" ]; then
    mysql -u "$DB_USER" -e "SELECT 1;" &> /dev/null
else
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null
fi

if [ $? -eq 0 ]; then
    echo "✓ MySQL connection successful"
else
    echo "✗ Cannot connect to MySQL. Please check:"
    echo "  - MySQL server is running"
    echo "  - DB_USER and DB_PASSWORD environment variables are set correctly"
    echo "  Current DB_USER: $DB_USER"
    exit 1
fi

# Check schema.sql exists
echo ""
echo "Checking schema.sql..."
if [ -f "schema.sql" ]; then
    echo "✓ schema.sql found"
else
    echo "✗ schema.sql not found in database directory"
    exit 1
fi

echo ""
echo "=== All checks passed! You can run the tests with: mvn test ==="
