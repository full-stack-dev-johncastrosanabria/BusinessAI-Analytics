# Database Schema

This directory contains the MySQL database schema and synthetic data generation tools for the BusinessAI-Analytics platform.

## Quick Start

**New to this project?** See [QUICK_START.md](QUICK_START.md) for a fast setup guide.

## Files

- `schema.sql` - Complete database schema with all tables, constraints, and indexes
- `generate_seed_data.py` - Python script to generate synthetic test data
- `test_seed_data.py` - Validation tests for the data generation script
- `SEED_DATA_README.md` - Comprehensive documentation for synthetic data generation
- `QUICK_START.md` - Fast setup guide for database and seed data

## Schema Overview

The database consists of 5 main tables:

1. **products** - Product catalog with name, category, cost, and price
2. **customers** - Customer records with name, email, segment, and country
3. **sales_transactions** - Sales transaction records linking customers and products
4. **business_metrics** - Monthly aggregated business metrics (sales, costs, expenses, profit)
5. **documents** - Uploaded document metadata and extracted text content

## Running the Schema Script

### Prerequisites

- MySQL 8.0 or higher installed and running
- Database created (e.g., `businessai_analytics`)

### Using MySQL Command Line

```bash
# Create database (if not exists)
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS businessai_analytics;"

# Run schema script
mysql -u root -p businessai_analytics < database/schema.sql
```

### Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Create database: `CREATE DATABASE IF NOT EXISTS businessai_analytics;`
4. Select the database: `USE businessai_analytics;`
5. Open `schema.sql` file
6. Execute the script

### Environment Variables

The microservices will connect to the database using these default settings:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/businessai_analytics
spring.datasource.username=root
spring.datasource.password=your_password
```

## Schema Features

### Idempotency

The schema script is idempotent - it can be run multiple times safely. It drops existing tables before creating them, ensuring a clean state.

### Foreign Key Constraints

- `sales_transactions.customer_id` → `customers.id` (ON DELETE RESTRICT, ON UPDATE CASCADE)
- `sales_transactions.product_id` → `products.id` (ON DELETE RESTRICT, ON UPDATE CASCADE)

The RESTRICT policy prevents deletion of customers or products that have associated sales transactions.

### Indexes

Performance indexes are created on:

- **products**: category, name
- **customers**: email (unique), segment, country
- **sales_transactions**: transaction_date, customer_id, product_id, composite indexes
- **business_metrics**: year/month (unique composite), profit
- **documents**: file_type, extraction_status, upload_date, full-text index on extracted_text

### Check Constraints

Data integrity constraints:

- Product cost and price must be >= 0
- Transaction quantity must be > 0
- Transaction total_amount must be >= 0
- Business metrics month must be 1-12
- Business metrics year must be 1900-9999
- Business metrics financial values must be >= 0 (except profit which can be negative)
- Document file_size must be >= 0

### Character Set

All tables use `utf8mb4` character set with `utf8mb4_unicode_ci` collation for full Unicode support including emojis and international characters.

## Table Details

### products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique product identifier |
| name | VARCHAR(255) | NOT NULL | Product name |
| category | VARCHAR(100) | NOT NULL | Product category |
| cost | DECIMAL(10,2) | NOT NULL, >= 0 | Product cost |
| price | DECIMAL(10,2) | NOT NULL, >= 0 | Product selling price |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | AUTO UPDATE | Last update timestamp |

### customers

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique customer identifier |
| name | VARCHAR(255) | NOT NULL | Customer name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Customer email address |
| segment | VARCHAR(100) | NOT NULL | Customer segment (e.g., Enterprise, SMB) |
| country | VARCHAR(100) | NOT NULL | Customer country |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | AUTO UPDATE | Last update timestamp |

### sales_transactions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| customer_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to customer |
| product_id | BIGINT | NOT NULL, FOREIGN KEY | Reference to product |
| transaction_date | DATE | NOT NULL | Date of transaction |
| quantity | INT | NOT NULL, > 0 | Quantity sold |
| total_amount | DECIMAL(10,2) | NOT NULL, >= 0 | Total transaction amount |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### business_metrics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique metric identifier |
| month | INT | NOT NULL, 1-12 | Month (1-12) |
| year | INT | NOT NULL, 1900-9999 | Year |
| total_sales | DECIMAL(12,2) | NOT NULL, >= 0 | Total sales for the month |
| total_costs | DECIMAL(12,2) | NOT NULL, >= 0 | Total costs for the month |
| total_expenses | DECIMAL(12,2) | NOT NULL, >= 0 | Total expenses for the month |
| profit | DECIMAL(12,2) | NOT NULL | Calculated profit (can be negative) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | AUTO UPDATE | Last update timestamp |

### documents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique document identifier |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| upload_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |
| file_size | BIGINT | NOT NULL, >= 0 | File size in bytes |
| file_type | VARCHAR(10) | NOT NULL | File extension (TXT, DOCX, PDF, XLSX) |
| extracted_text | MEDIUMTEXT | NULL | Extracted text content (up to 16MB) |
| extraction_status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | Status: PENDING, SUCCESS, FAILED |
| error_message | TEXT | NULL | Error message if extraction failed |

## Verification

After running the schema script, verify the tables were created:

```sql
SHOW TABLES;

-- Check table structure
DESCRIBE products;
DESCRIBE customers;
DESCRIBE sales_transactions;
DESCRIBE business_metrics;
DESCRIBE documents;

-- Check foreign key constraints
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'businessai_analytics'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Check indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'businessai_analytics'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

## Generating Synthetic Test Data

After creating the schema, populate the database with realistic synthetic data using the provided Python script.

### Prerequisites

- Python 3.7 or higher
- MySQL Connector Python: `pip install mysql-connector-python`
- Database schema already created (run `schema.sql` first)

### Running the Seed Data Script

```bash
# Install required Python package
pip install mysql-connector-python

# Run the data generation script
python3 database/generate_seed_data.py
```

The script will:
1. Prompt for your MySQL password
2. Clear any existing data from all tables
3. Generate 30 products across 5 categories (Electronics, Furniture, Clothing, Food, Books)
4. Generate 100 customers across 3 segments (Enterprise, SMB, Startup) and 10 countries
5. Generate 5000 sales transactions spanning 5 years with realistic trends
6. Generate 60 monthly business metrics (5 years of data)
7. Display a summary of generated data

### Data Characteristics

The generated data exhibits realistic business patterns:

**Sales Trends:**
- 5% annual growth trend
- Seasonal patterns (higher sales in Q4, lower in Q1)
- Weekly patterns (lower sales on weekends)
- Random variability

**Business Metrics:**
- Both profitable and unprofitable months
- Seasonal expense variations
- Occasional unexpected high expenses
- Realistic profit margins

**Data Volumes:**
- 30 products across 5 categories
- 100 customers across 3 segments and 10 countries
- 5000 sales transactions over 5 years
- 60 monthly business metric records

### Customization

You can modify the script to adjust:
- Number of customers (default: 100)
- Number of transactions (default: 5000)
- Date range (default: 5 years ending today)
- Product catalog (edit PRODUCTS list)
- Trend parameters (growth rate, seasonality factors)

Edit the script constants at the top of `generate_seed_data.py` to customize the data generation.

## Next Steps

After creating the schema and generating seed data:

1. Verify data was generated correctly (see summary output)
2. Configure microservices with database connection details
3. Start the microservices and verify database connectivity
4. Run integration tests to validate schema correctness
5. Train AI models using the generated historical data
