# Database Schema Property-Based Tests

This module contains property-based tests for the BusinessAI-Analytics database schema using jqwik.

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- MySQL 8.0 running locally on port 3306
- Database user credentials (default: root with no password)

### Installing Maven

**macOS (using Homebrew):**
```bash
brew install maven
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install maven
```

**Windows:**
Download from [Apache Maven](https://maven.apache.org/download.cgi) and follow installation instructions.

## Configuration

The tests use the following environment variables for database connection:

- `DB_USER`: MySQL username (default: `root`)
- `DB_PASSWORD`: MySQL password (default: empty string)

You can set these before running tests:

```bash
export DB_USER=your_username
export DB_PASSWORD=your_password
```

## Running the Tests

From the `database` directory:

```bash
mvn test
```

To run only the schema idempotence test:

```bash
mvn test -Dtest=SchemaIdempotenceProperties
```

## Test Details

### Property 21: Schema Script Idempotence

**Validates: Requirements 16.6**

This property-based test verifies that the `schema.sql` script is idempotent - it can be run multiple times without errors and produces the same final schema state.

**Test Strategy:**
- Creates a temporary test database
- Executes the schema script 2-5 times (randomly chosen by jqwik)
- Captures the complete schema state after each execution including:
  - Tables
  - Columns (name, type, size, nullable)
  - Primary keys
  - Foreign keys
  - Indexes
- Verifies that the schema state remains identical across all executions
- Verifies all expected tables exist (products, customers, sales_transactions, business_metrics, documents)
- Cleans up the test database after completion

**Why This Matters:**
Idempotent schema scripts are critical for:
- Safe deployment and redeployment
- Development environment setup
- CI/CD pipelines
- Database migrations and updates

The test ensures that running the schema script multiple times (e.g., accidentally or during automated deployments) will not cause errors or schema inconsistencies.

## Test Output

Successful test output will show:
```
SchemaIdempotenceProperties:schemaScriptIsIdempotent = 
  tries = 10
  checks = 10
  generation-mode = RANDOMIZED
  seed = <random-seed>
```

If the test fails, it will show:
- Which execution caused the failure
- The differences between expected and actual schema states
- Detailed information about tables, columns, keys, and indexes that differ

## Troubleshooting

**Cannot connect to MySQL:**
- Ensure MySQL is running: `mysql.server start` or `sudo systemctl start mysql`
- Verify connection: `mysql -u root -p`
- Check credentials match environment variables

**Permission denied:**
- Ensure the database user has CREATE DATABASE and DROP DATABASE privileges
- Grant privileges: `GRANT ALL PRIVILEGES ON *.* TO 'your_user'@'localhost';`

**Schema file not found:**
- The test expects `schema.sql` to be in the `database` directory
- Verify the file exists: `ls -la database/schema.sql`
