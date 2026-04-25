# Quick Start: Database Setup and Seed Data

This guide provides the fastest path to setting up the BusinessAI-Analytics database with synthetic test data.

## Prerequisites

- MySQL 8.0+ installed and running
- Python 3.7+ installed
- MySQL root password

## Step-by-Step Setup

### 1. Create Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS businessai_analytics;"
```

### 2. Run Schema Script

```bash
mysql -u root -p businessai_analytics < database/schema.sql
```

Expected output:
```
+--------------------------------------------------+
| status                                           |
+--------------------------------------------------+
| Schema creation completed successfully           |
+--------------------------------------------------+
```

### 3. Install Python Dependencies

```bash
pip3 install mysql-connector-python
```

### 4. Generate Synthetic Data

```bash
python3 database/generate_seed_data.py
```

You'll be prompted for your MySQL password. The script will:
- Clear any existing data
- Generate 30 products
- Generate 100 customers
- Generate 5000 sales transactions (5 years)
- Generate 60 monthly business metrics
- Display a summary

Expected runtime: 10-30 seconds

### 5. Verify Data

```bash
mysql -u root -p businessai_analytics -e "
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'sales_transactions', COUNT(*) FROM sales_transactions
UNION ALL SELECT 'business_metrics', COUNT(*) FROM business_metrics;
"
```

Expected output:
```
+---------------------+-------+
| table_name          | count |
+---------------------+-------+
| products            |    30 |
| customers           |   100 |
| sales_transactions  |  5000 |
| business_metrics    |    60 |
+---------------------+-------+
```

## Troubleshooting

### "Access denied for user 'root'"
- Verify your MySQL password
- Try: `mysql -u root -p` to test connection

### "Unknown database 'businessai_analytics'"
- Run step 1 to create the database

### "No module named 'mysql'"
- Run step 3 to install Python dependencies

### "Foreign key constraint fails"
- Drop and recreate the database:
  ```bash
  mysql -u root -p -e "DROP DATABASE IF EXISTS businessai_analytics;"
  mysql -u root -p -e "CREATE DATABASE businessai_analytics;"
  ```
- Then repeat steps 2-4

## What's Next?

After completing these steps:

1. **Configure microservices** with database connection:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/businessai_analytics
   spring.datasource.username=root
   spring.datasource.password=your_password
   ```

2. **Train AI models** using the generated historical data

3. **Start the application** and verify data appears in the dashboard

## Files Reference

- `schema.sql` - Database schema (tables, constraints, indexes)
- `generate_seed_data.py` - Synthetic data generation script
- `test_seed_data.py` - Validation tests for the script
- `SEED_DATA_README.md` - Detailed documentation
- `QUICK_START.md` - This file

## Data Summary

The generated data includes:

| Entity | Count | Details |
|--------|-------|---------|
| Products | 30 | 5 categories: Electronics, Furniture, Clothing, Food, Books |
| Customers | 100 | 3 segments (Enterprise, SMB, Startup), 10 countries |
| Sales Transactions | 5000 | 5 years of data with realistic trends |
| Business Metrics | 60 | Monthly aggregates for 5 years |

**Trends:**
- 5% annual growth
- Seasonal patterns (Q4 high, Q1 low)
- ~70-80% profitable months
- ~20-30% unprofitable months

## Support

For detailed information:
- See `SEED_DATA_README.md` for comprehensive documentation
- See `README.md` for schema details
- Run `python3 database/test_seed_data.py` to validate script configuration
