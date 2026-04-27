#!/usr/bin/env python3
"""
Synthetic Data Generation Script for BusinessAI-Analytics Platform

This script generates realistic synthetic business data including:
- 30 products across 5 categories
- 100 customers across 3 segments and 10 countries
- 10,000 sales transactions spanning 8 years with realistic trends
- 96 business metrics (8 years of monthly data)

The data exhibits realistic trends including:
- Strong seasonality (Q4 peaks, Q1 dips)
- Growth trends (8% annual growth)
- Monthly and weekly patterns
- Variability with both profitable and unprofitable months

Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6
"""

import mysql.connector
import random
import math
from datetime import datetime, timedelta
from decimal import Decimal
import sys

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'Cnzmws67',  # Will be prompted or set via environment
    'database': 'businessai'
}

# Product categories and sample products
CATEGORIES = ['Electronics', 'Furniture', 'Clothing', 'Food', 'Books']

PRODUCTS = [
    # Electronics (6 products)
    ('Laptop Pro 15', 'Electronics', 800.00, 1200.00),
    ('Wireless Mouse', 'Electronics', 15.00, 35.00),
    ('USB-C Hub', 'Electronics', 25.00, 55.00),
    ('Mechanical Keyboard', 'Electronics', 60.00, 120.00),
    ('27" Monitor', 'Electronics', 200.00, 350.00),
    ('Webcam HD', 'Electronics', 40.00, 80.00),
    
    # Furniture (6 products)
    ('Office Chair Ergonomic', 'Furniture', 150.00, 300.00),
    ('Standing Desk', 'Furniture', 250.00, 500.00),
    ('Bookshelf Oak', 'Furniture', 80.00, 180.00),
    ('Filing Cabinet', 'Furniture', 100.00, 220.00),
    ('Conference Table', 'Furniture', 400.00, 800.00),
    ('Desk Lamp LED', 'Furniture', 30.00, 65.00),
    
    # Clothing (6 products)
    ('Business Shirt', 'Clothing', 20.00, 50.00),
    ('Formal Pants', 'Clothing', 30.00, 70.00),
    ('Blazer', 'Clothing', 80.00, 180.00),
    ('Dress Shoes', 'Clothing', 50.00, 120.00),
    ('Tie Silk', 'Clothing', 15.00, 40.00),
    ('Belt Leather', 'Clothing', 20.00, 50.00),
    
    # Food (6 products)
    ('Coffee Beans Premium', 'Food', 8.00, 20.00),
    ('Tea Assortment', 'Food', 10.00, 25.00),
    ('Snack Box', 'Food', 5.00, 15.00),
    ('Energy Bars Pack', 'Food', 12.00, 28.00),
    ('Bottled Water Case', 'Food', 6.00, 15.00),
    ('Fruit Basket', 'Food', 15.00, 35.00),
    
    # Books (6 products)
    ('Business Strategy Guide', 'Books', 12.00, 30.00),
    ('Leadership Handbook', 'Books', 15.00, 35.00),
    ('Marketing Essentials', 'Books', 18.00, 40.00),
    ('Finance for Managers', 'Books', 20.00, 45.00),
    ('Project Management', 'Books', 16.00, 38.00),
    ('Data Analytics Primer', 'Books', 22.00, 50.00),
]

# Customer segments and countries
SEGMENTS = ['Enterprise', 'SMB', 'Startup']
COUNTRIES = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Brazil', 'India', 'Singapore']

# First and last names for customer generation
FIRST_NAMES = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
    'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
]

LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
    'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
]


def get_db_connection():
    """Establish database connection with user-provided password if needed."""
    config = DB_CONFIG.copy()
    
    # Prompt for password if not set
    if not config['password']:
        import getpass
        config['password'] = getpass.getpass(f"Enter MySQL password for user '{config['user']}': ")
    
    try:
        conn = mysql.connector.connect(**config)
        print(f"✓ Connected to database '{config['database']}'")
        return conn
    except mysql.connector.Error as err:
        print(f"✗ Database connection failed: {err}")
        sys.exit(1)


def clear_existing_data(cursor):
    """Clear existing data from all tables (in reverse dependency order)."""
    print("\nClearing existing data...")
    
    tables = ['sales_transactions', 'business_metrics', 'documents', 'customers', 'products']
    
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")
        print(f"  ✓ Cleared {table}")
    
    # Reset auto-increment counters
    for table in tables:
        cursor.execute(f"ALTER TABLE {table} AUTO_INCREMENT = 1")


def generate_products(cursor):
    """Generate 30 products across 5 categories."""
    print("\nGenerating products...")
    
    insert_query = """
        INSERT INTO products (name, category, cost, price)
        VALUES (%s, %s, %s, %s)
    """
    
    cursor.executemany(insert_query, PRODUCTS)
    print(f"  ✓ Generated {len(PRODUCTS)} products across {len(CATEGORIES)} categories")
    
    return len(PRODUCTS)


def generate_customers(cursor, count=100):
    """Generate customers across 3 segments and 10 countries."""
    print("\nGenerating customers...")
    
    insert_query = """
        INSERT INTO customers (name, email, segment, country)
        VALUES (%s, %s, %s, %s)
    """
    
    customers = []
    used_emails = set()
    
    for i in range(count):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        name = f"{first_name} {last_name}"
        
        # Generate unique email
        email_base = f"{first_name.lower()}.{last_name.lower()}"
        email = f"{email_base}@example.com"
        counter = 1
        while email in used_emails:
            email = f"{email_base}{counter}@example.com"
            counter += 1
        used_emails.add(email)
        
        segment = random.choice(SEGMENTS)
        country = random.choice(COUNTRIES)
        
        customers.append((name, email, segment, country))
    
    cursor.executemany(insert_query, customers)
    print(f"  ✓ Generated {count} customers across {len(SEGMENTS)} segments and {len(COUNTRIES)} countries")
    
    return count


def generate_sales_transactions(cursor, num_products, num_customers, count=10000):
    """
    Generate sales transactions spanning 8 years with realistic trends.
    
    Enhanced trends include:
    - Overall growth trend (8% annual growth with some variability)
    - Strong seasonal patterns (Q4 peak, Q1 dip, summer slowdown)
    - Weekly patterns (higher on weekdays)
    - Monthly cycles within quarters
    - Random variability with occasional spikes
    """
    print("\nGenerating sales transactions...")
    
    # Date range: 8 years ending today
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=8*365)
    
    insert_query = """
        INSERT INTO sales_transactions (customer_id, product_id, transaction_date, quantity, total_amount)
        VALUES (%s, %s, %s, %s, %s)
    """
    
    transactions = []
    
    # Get product prices for total amount calculation
    cursor.execute("SELECT id, price FROM products")
    product_prices = {row[0]: float(row[1]) for row in cursor.fetchall()}
    
    for i in range(count):
        # Generate random date within range
        days_offset = random.randint(0, (end_date - start_date).days)
        transaction_date = start_date + timedelta(days=days_offset)
        
        # Calculate trend multiplier based on date
        year_progress = (transaction_date - start_date).days / 365.0
        
        # Growth trend: 8% annual growth with some year-to-year variability
        year_num = int(year_progress)
        year_variability = random.uniform(0.95, 1.05)  # ±5% per year
        growth_factor = (1.0 + (0.08 * year_progress)) * year_variability
        
        # Strong seasonal pattern
        month = transaction_date.month
        if month == 12:  # December peak (holiday shopping)
            seasonal_factor = 1.8
        elif month == 11:  # November (Black Friday)
            seasonal_factor = 1.6
        elif month == 10:  # October
            seasonal_factor = 1.3
        elif month in [1, 2]:  # January-February (post-holiday slump)
            seasonal_factor = 0.6
        elif month == 3:  # March (recovery)
            seasonal_factor = 0.8
        elif month in [7, 8]:  # Summer slowdown
            seasonal_factor = 0.85
        elif month in [4, 5, 6]:  # Spring (moderate)
            seasonal_factor = 1.0
        else:  # September (back-to-school)
            seasonal_factor = 1.2
        
        # Weekly pattern: lower on weekends
        weekday = transaction_date.weekday()
        if weekday >= 5:  # Weekend
            weekly_factor = 0.7
        elif weekday == 4:  # Friday
            weekly_factor = 1.1
        else:
            weekly_factor = 1.0
        
        # Monthly cycle: higher at month-end (budget spending)
        day = transaction_date.day
        if day >= 25:
            monthly_factor = 1.2
        elif day <= 5:
            monthly_factor = 0.9
        else:
            monthly_factor = 1.0
        
        # Occasional promotional spikes (5% chance)
        promo_factor = 1.5 if random.random() < 0.05 else 1.0
        
        # Combined probability for this date
        probability = growth_factor * seasonal_factor * weekly_factor * monthly_factor * promo_factor
        
        # Random customer and product
        customer_id = random.randint(1, num_customers)
        product_id = random.randint(1, num_products)
        
        # Quantity influenced by probability (higher probability = higher quantities)
        base_quantity = random.choices([1, 2, 3, 4, 5, 10, 15], weights=[35, 25, 15, 12, 8, 3, 2])[0]
        quantity = max(1, int(base_quantity * probability * random.uniform(0.7, 1.3)))
        
        # Calculate total amount
        price = product_prices[product_id]
        total_amount = round(price * quantity, 2)
        
        transactions.append((customer_id, product_id, transaction_date, quantity, total_amount))
    
    # Sort by date for better data organization
    transactions.sort(key=lambda x: x[2])
    
    cursor.executemany(insert_query, transactions)
    print(f"  ✓ Generated {count} sales transactions spanning 8 years")
    print(f"    Date range: {start_date} to {end_date}")
    
    return start_date, end_date


def generate_business_metrics(cursor, start_date, end_date):
    """
    Generate monthly business metrics (8 years = 96 months) with realistic trends.
    
    Enhanced metrics include:
    - Total sales (aggregated from transactions)
    - Total costs (based on product costs with efficiency improvements over time)
    - Total expenses (operational expenses with seasonality and growth)
    - Profit (sales - costs - expenses)
    
    Features:
    - Clear seasonal patterns matching sales
    - Gradual cost efficiency improvements (economies of scale)
    - Variable profitability with realistic unprofitable months
    """
    print("\nGenerating business metrics...")
    
    insert_query = """
        INSERT INTO business_metrics (month, year, total_sales, total_costs, total_expenses, profit)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    
    metrics = []
    
    # Generate metrics for each month in the 8-year period
    current_date = start_date.replace(day=1)
    end_month = end_date.replace(day=1)
    month_count = 0
    
    while current_date <= end_month:
        month = current_date.month
        year = current_date.year
        
        # Calculate next month for date range
        if month == 12:
            next_month = current_date.replace(year=year+1, month=1)
        else:
            next_month = current_date.replace(month=month+1)
        
        # Aggregate sales for this month
        cursor.execute("""
            SELECT 
                COALESCE(SUM(st.total_amount), 0) as total_sales,
                COALESCE(SUM(p.cost * st.quantity), 0) as total_costs
            FROM sales_transactions st
            JOIN products p ON st.product_id = p.id
            WHERE st.transaction_date >= %s AND st.transaction_date < %s
        """, (current_date, next_month))
        
        result = cursor.fetchone()
        total_sales = float(result[0])
        total_costs = float(result[1])
        
        # Apply cost efficiency improvements over time (economies of scale)
        # Costs decrease by 0.5% per year as business matures
        years_elapsed = month_count / 12.0
        efficiency_factor = 1.0 - (0.005 * years_elapsed)
        total_costs = round(total_costs * efficiency_factor, 2)
        
        # Generate operational expenses with realistic patterns
        # Base expenses: 25-35% of sales
        base_expense_rate = 0.28
        
        # Seasonal variation in expenses (matches sales seasonality)
        if month == 12:  # December: high expenses (bonuses, parties)
            expense_multiplier = 1.4
        elif month == 11:  # November: moderate increase
            expense_multiplier = 1.2
        elif month in [1, 2]:  # Jan-Feb: lower expenses (post-holiday)
            expense_multiplier = 0.9
        elif month in [7, 8]:  # Summer: moderate (vacations, cooling)
            expense_multiplier = 1.1
        else:
            expense_multiplier = 1.0
        
        # Growth in fixed expenses over time (inflation, expansion)
        expense_growth = 1.0 + (0.03 * years_elapsed)  # 3% annual growth
        
        # Add controlled variability
        random_factor = random.uniform(0.85, 1.15)
        
        total_expenses = round(
            total_sales * base_expense_rate * expense_multiplier * expense_growth * random_factor,
            2
        )
        
        # Occasionally add unexpected expenses (10% chance)
        if random.random() < 0.10:
            unexpected_expense = round(random.uniform(3000, 12000), 2)
            total_expenses += unexpected_expense
        
        # Calculate profit
        profit = round(total_sales - total_costs - total_expenses, 2)
        
        metrics.append((month, year, total_sales, total_costs, total_expenses, profit))
        
        # Move to next month
        current_date = next_month
        month_count += 1
    
    cursor.executemany(insert_query, metrics)
    
    # Calculate statistics
    profitable_months = sum(1 for m in metrics if m[5] > 0)
    unprofitable_months = len(metrics) - profitable_months
    total_profit = sum(m[5] for m in metrics)
    avg_monthly_sales = sum(m[2] for m in metrics) / len(metrics)
    
    print(f"  ✓ Generated {len(metrics)} months of business metrics")
    print(f"    Profitable months: {profitable_months}")
    print(f"    Unprofitable months: {unprofitable_months}")
    print(f"    Total profit over period: ${total_profit:,.2f}")
    print(f"    Average monthly sales: ${avg_monthly_sales:,.2f}")
    
    return len(metrics)


def print_summary(cursor):
    """Print summary statistics of generated data."""
    print("\n" + "="*60)
    print("DATA GENERATION SUMMARY")
    print("="*60)
    
    # Products
    cursor.execute("SELECT COUNT(*) FROM products")
    product_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT category) FROM products")
    category_count = cursor.fetchone()[0]
    print(f"\nProducts: {product_count} across {category_count} categories")
    
    # Customers
    cursor.execute("SELECT COUNT(*) FROM customers")
    customer_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT segment) FROM customers")
    segment_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(DISTINCT country) FROM customers")
    country_count = cursor.fetchone()[0]
    print(f"Customers: {customer_count} across {segment_count} segments and {country_count} countries")
    
    # Sales Transactions
    cursor.execute("SELECT COUNT(*) FROM sales_transactions")
    transaction_count = cursor.fetchone()[0]
    cursor.execute("SELECT MIN(transaction_date), MAX(transaction_date) FROM sales_transactions")
    date_range = cursor.fetchone()
    cursor.execute("SELECT SUM(total_amount) FROM sales_transactions")
    total_revenue = cursor.fetchone()[0]
    print(f"Sales Transactions: {transaction_count}")
    print(f"  Date range: {date_range[0]} to {date_range[1]}")
    print(f"  Total revenue: ${float(total_revenue):,.2f}")
    
    # Business Metrics
    cursor.execute("SELECT COUNT(*) FROM business_metrics")
    metrics_count = cursor.fetchone()[0]
    cursor.execute("SELECT SUM(profit) FROM business_metrics")
    total_profit = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM business_metrics WHERE profit > 0")
    profitable_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM business_metrics WHERE profit < 0")
    unprofitable_count = cursor.fetchone()[0]
    print(f"Business Metrics: {metrics_count} months")
    print(f"  Total profit: ${float(total_profit):,.2f}")
    print(f"  Profitable months: {profitable_count}")
    print(f"  Unprofitable months: {unprofitable_count}")
    
    # Best and worst months
    cursor.execute("""
        SELECT year, month, profit 
        FROM business_metrics 
        ORDER BY profit DESC 
        LIMIT 1
    """)
    best_month = cursor.fetchone()
    cursor.execute("""
        SELECT year, month, profit 
        FROM business_metrics 
        ORDER BY profit ASC 
        LIMIT 1
    """)
    worst_month = cursor.fetchone()
    print(f"  Best month: {best_month[0]}-{best_month[1]:02d} (${float(best_month[2]):,.2f})")
    print(f"  Worst month: {worst_month[0]}-{worst_month[1]:02d} (${float(worst_month[2]):,.2f})")
    
    print("\n" + "="*60)
    print("✓ Synthetic data generation completed successfully!")
    print("="*60 + "\n")


def main():
    """Main execution function."""
    print("="*60)
    print("BusinessAI-Analytics Synthetic Data Generator")
    print("="*60)
    
    # Connect to database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Clear existing data
        clear_existing_data(cursor)
        conn.commit()
        
        # Generate products
        num_products = generate_products(cursor)
        conn.commit()
        
        # Generate customers
        num_customers = generate_customers(cursor, count=100)
        conn.commit()
        
        # Generate sales transactions (10000 for 8 years)
        start_date, end_date = generate_sales_transactions(cursor, num_products, num_customers, count=10000)
        conn.commit()
        
        # Generate business metrics
        generate_business_metrics(cursor, start_date, end_date)
        conn.commit()
        
        # Print summary
        print_summary(cursor)
        
    except Exception as e:
        print(f"\n✗ Error during data generation: {e}")
        conn.rollback()
        sys.exit(1)
    
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
