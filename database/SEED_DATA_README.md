# Synthetic Data Generation Guide

This guide explains how to use the `generate_seed_data.py` script to populate the BusinessAI-Analytics database with realistic synthetic test data.

## Overview

The script generates:
- **30 products** across 5 categories (Electronics, Furniture, Clothing, Food, Books)
- **100 customers** across 3 segments (Enterprise, SMB, Startup) and 10 countries
- **5000 sales transactions** spanning 5 years with realistic trends
- **60 business metrics** representing 5 years of monthly aggregated data

## Prerequisites

1. **MySQL 8.0+** installed and running
2. **Python 3.7+** installed
3. **Database schema** already created (run `schema.sql` first)
4. **MySQL Connector Python** package

## Installation

### Step 1: Install Python Package

```bash
pip install mysql-connector-python
```

Or using pip3:

```bash
pip3 install mysql-connector-python
```

### Step 2: Verify Database Schema

Ensure the database schema is created:

```bash
mysql -u root -p businessai_analytics < database/schema.sql
```

## Usage

### Basic Usage

Run the script from the project root directory:

```bash
python3 database/generate_seed_data.py
```

The script will prompt for your MySQL password:

```
Enter MySQL password for user 'root': 
```

### Using Environment Variables

You can set the database password via environment variable to avoid the prompt:

```bash
# Set password in environment (not recommended for production)
export MYSQL_PASSWORD="your_password"

# Modify script to use environment variable
# Or pass it via command line arguments (requires script modification)
```

### Custom Database Configuration

Edit the `DB_CONFIG` dictionary at the top of the script to customize connection settings:

```python
DB_CONFIG = {
    'host': 'localhost',      # Change if MySQL is on different host
    'user': 'root',           # Change if using different user
    'password': '',           # Can set password here (not recommended)
    'database': 'businessai_analytics'  # Change if using different database name
}
```

## Generated Data Details

### Products (30 items)

**Categories:**
- Electronics: Laptops, monitors, keyboards, mice, webcams, USB hubs
- Furniture: Desks, chairs, bookshelves, filing cabinets, lamps
- Clothing: Shirts, pants, blazers, shoes, ties, belts
- Food: Coffee, tea, snacks, energy bars, water, fruit baskets
- Books: Business, leadership, marketing, finance, project management guides

**Pricing:**
- Cost: $5 - $800
- Price: $15 - $1,200
- Realistic profit margins (30-50%)

### Customers (100 individuals)

**Segments:**
- Enterprise: Large corporations
- SMB: Small and medium businesses
- Startup: New companies

**Countries:**
USA, Canada, UK, Germany, France, Japan, Australia, Brazil, India, Singapore

**Email Format:**
firstname.lastname@example.com (with unique suffixes if needed)

### Sales Transactions (5000 records)

**Date Range:**
5 years ending today (e.g., 2020-01-01 to 2024-12-31)

**Realistic Trends:**

1. **Growth Trend**: 5% annual growth
2. **Seasonal Patterns**:
   - Q4 (Oct-Dec): 30% higher sales
   - Q1 (Jan-Mar): 30% lower sales
   - Summer (Jul-Aug): 10% lower sales
3. **Weekly Patterns**:
   - Weekdays: Normal sales
   - Weekends: 40% lower sales
4. **Random Variability**: ±20% variation

**Quantity Distribution:**
- Most transactions: 1-3 items
- Some bulk orders: 4-10 items
- Weighted by trend factors

### Business Metrics (60 months)

**Components:**

1. **Total Sales**: Aggregated from sales transactions
2. **Total Costs**: Based on product costs × quantities sold
3. **Total Expenses**: Operational expenses (20-40% of sales)
4. **Profit**: Sales - Costs - Expenses

**Characteristics:**

- **Profitable months**: ~70-80% of months
- **Unprofitable months**: ~20-30% of months (realistic variability)
- **Seasonal expense variations**:
  - Winter (Dec-Feb): 20% higher expenses (heating, holidays)
  - Summer (Jul-Aug): 10% higher expenses (cooling, vacations)
- **Unexpected expenses**: 10% chance of high one-time expenses ($5,000-$15,000)

## Output

The script provides detailed progress output:

```
============================================================
BusinessAI-Analytics Synthetic Data Generator
============================================================
✓ Connected to database 'businessai_analytics'

Clearing existing data...
  ✓ Cleared sales_transactions
  ✓ Cleared business_metrics
  ✓ Cleared documents
  ✓ Cleared customers
  ✓ Cleared products

Generating products...
  ✓ Generated 30 products across 5 categories

Generating customers...
  ✓ Generated 100 customers across 3 segments and 10 countries

Generating sales transactions...
  ✓ Generated 5000 sales transactions spanning 5 years
    Date range: 2020-01-15 to 2024-12-31

Generating business metrics...
  ✓ Generated 60 monthly business metrics
    Profitable months: 45
    Unprofitable months: 15
    Average profit: $12,345.67

============================================================
DATA GENERATION SUMMARY
============================================================

Products: 30 across 5 categories
Customers: 100 across 3 segments and 10 countries
Sales Transactions: 5000
  Date range: 2020-01-15 to 2024-12-31
  Total revenue: $1,234,567.89
Business Metrics: 60 months
  Total profit: $741,234.56
  Profitable months: 45
  Unprofitable months: 15
  Best month: 2024-11 ($45,678.90)
  Worst month: 2021-02 ($-8,234.12)

============================================================
✓ Synthetic data generation completed successfully!
============================================================
```

## Verification

After running the script, verify the data in MySQL:

```sql
-- Check record counts
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'sales_transactions', COUNT(*) FROM sales_transactions
UNION ALL
SELECT 'business_metrics', COUNT(*) FROM business_metrics;

-- Check date range
SELECT 
    MIN(transaction_date) as first_sale,
    MAX(transaction_date) as last_sale,
    DATEDIFF(MAX(transaction_date), MIN(transaction_date)) as days_span
FROM sales_transactions;

-- Check profit distribution
SELECT 
    COUNT(*) as total_months,
    SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as profitable_months,
    SUM(CASE WHEN profit < 0 THEN 1 ELSE 0 END) as unprofitable_months,
    AVG(profit) as avg_profit,
    MIN(profit) as worst_month,
    MAX(profit) as best_month
FROM business_metrics;

-- Check sales by category
SELECT 
    p.category,
    COUNT(*) as transaction_count,
    SUM(st.quantity) as total_quantity,
    SUM(st.total_amount) as total_revenue
FROM sales_transactions st
JOIN products p ON st.product_id = p.id
GROUP BY p.category
ORDER BY total_revenue DESC;

-- Check customer distribution
SELECT 
    segment,
    COUNT(*) as customer_count
FROM customers
GROUP BY segment;

SELECT 
    country,
    COUNT(*) as customer_count
FROM customers
GROUP BY country
ORDER BY customer_count DESC;
```

## Customization

### Adjusting Data Volumes

Edit the function calls in `main()`:

```python
# Generate more/fewer customers
num_customers = generate_customers(cursor, count=200)  # Default: 100

# Generate more/fewer transactions
start_date, end_date = generate_sales_transactions(
    cursor, num_products, num_customers, count=10000  # Default: 5000
)
```

### Modifying Products

Edit the `PRODUCTS` list to add/remove/modify products:

```python
PRODUCTS = [
    ('Your Product Name', 'Category', cost, price),
    # Add more products...
]
```

### Adjusting Trends

Modify trend factors in `generate_sales_transactions()`:

```python
# Growth trend (default: 5% annual)
growth_factor = 1.0 + (0.08 * year_progress)  # Change to 8%

# Seasonal factors (default: Q4=1.3, Q1=0.7)
if month in [10, 11, 12]:
    seasonal_factor = 1.5  # Increase Q4 boost
```

### Changing Date Range

Modify the date range in `generate_sales_transactions()`:

```python
# Default: 5 years ending today
end_date = datetime.now().date()
start_date = end_date - timedelta(days=5*365)

# Change to 3 years
start_date = end_date - timedelta(days=3*365)

# Or use specific dates
start_date = datetime(2022, 1, 1).date()
end_date = datetime(2024, 12, 31).date()
```

## Troubleshooting

### Connection Errors

**Error**: `Access denied for user 'root'@'localhost'`

**Solution**: Verify MySQL password and user permissions:

```bash
mysql -u root -p -e "SELECT USER(), DATABASE();"
```

**Error**: `Unknown database 'businessai_analytics'`

**Solution**: Create the database first:

```bash
mysql -u root -p -e "CREATE DATABASE businessai_analytics;"
```

### Module Not Found

**Error**: `ModuleNotFoundError: No module named 'mysql'`

**Solution**: Install mysql-connector-python:

```bash
pip3 install mysql-connector-python
```

### Foreign Key Constraint Errors

**Error**: `Cannot add or update a child row: a foreign key constraint fails`

**Solution**: Ensure the script runs in the correct order (products and customers before transactions). The script handles this automatically, but if you modify it, maintain the dependency order.

### Data Already Exists

The script automatically clears existing data before generating new data. If you want to preserve existing data, comment out the `clear_existing_data()` call in `main()`.

## Requirements Validation

This script satisfies the following requirements:

- **Requirement 14.1**: ✓ 30 products across 5 categories
- **Requirement 14.2**: ✓ 100 customers across 3 segments and 10 countries
- **Requirement 14.3**: ✓ 5000 sales transactions spanning 5 years
- **Requirement 14.4**: ✓ 60 business metrics (5 years of monthly data)
- **Requirement 14.5**: ✓ Realistic trends with seasonality and growth
- **Requirement 14.6**: ✓ Both profitable and unprofitable months

## Next Steps

After generating synthetic data:

1. **Verify data quality**: Run the verification queries above
2. **Start microservices**: Configure and start all Spring Boot services
3. **Train AI models**: Use the generated historical data to train forecasting models
4. **Test frontend**: Verify dashboard displays data correctly
5. **Test chatbot**: Ensure chatbot can query the generated data

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify MySQL connection and permissions
3. Review the script output for specific error messages
4. Check the database schema is correctly created
