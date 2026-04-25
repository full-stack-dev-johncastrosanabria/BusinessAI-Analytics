-- BusinessAI-Analytics Database Schema
-- This script creates all required tables for the BusinessAI-Analytics platform
-- The script is idempotent and can be run multiple times safely

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS sales_transactions;
DROP TABLE IF EXISTS business_metrics;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS products;

-- Products table
-- Stores product information including name, category, cost, and price
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL CHECK (cost >= 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
-- Stores customer information including name, email, segment, and country
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    segment VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_segment (segment),
    INDEX idx_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales transactions table
-- Stores sales transaction records with customer and product references
CREATE TABLE sales_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    transaction_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_customer_id (customer_id),
    INDEX idx_product_id (product_id),
    INDEX idx_date_customer (transaction_date, customer_id),
    INDEX idx_date_product (transaction_date, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business metrics table
-- Stores monthly aggregated business metrics including sales, costs, expenses, and profit
CREATE TABLE business_metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year INT NOT NULL CHECK (year >= 1900 AND year <= 9999),
    total_sales DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_sales >= 0),
    total_costs DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_costs >= 0),
    total_expenses DECIMAL(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_expenses >= 0),
    profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_month_year (month, year),
    INDEX idx_year_month (year, month),
    INDEX idx_profit (profit)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documents table
-- Stores uploaded document metadata and extracted text content
CREATE TABLE documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size BIGINT NOT NULL CHECK (file_size >= 0),
    file_type VARCHAR(10) NOT NULL,
    extracted_text MEDIUMTEXT,
    extraction_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    INDEX idx_file_type (file_type),
    INDEX idx_extraction_status (extraction_status),
    INDEX idx_upload_date (upload_date),
    FULLTEXT INDEX idx_extracted_text (extracted_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table creation
SELECT 'Schema creation completed successfully' AS status;
SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('products', 'customers', 'sales_transactions', 'business_metrics', 'documents')
ORDER BY TABLE_NAME;
