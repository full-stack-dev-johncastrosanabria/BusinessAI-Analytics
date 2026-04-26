"""
Database connection and query utilities for AI Service
"""

import mysql.connector
from mysql.connector import Error
import logging
from typing import List, Dict, Any, Optional
import numpy as np
import os

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """MySQL database connection pool and query utilities"""
    
    def __init__(self, host="localhost", user="root", password=None, database="businessai"):
        """
        Initialize database connection
        
        Args:
            host: MySQL host
            user: MySQL user
            password: MySQL password (defaults to MYSQL_PASSWORD env var)
            database: Database name
        """
        try:
            # Use environment variable if password not provided
            if password is None:
                password = os.getenv("MYSQL_PASSWORD", "")
            
            self.connection = mysql.connector.connect(
                host=host,
                user=user,
                password=password,
                database=database
            )
            logger.info("Database connection established")
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("Database connection closed")
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict[str, Any]]:
        """
        Execute a SELECT query and return results
        
        Args:
            query: SQL query string
            params: Query parameters
        
        Returns:
            List of dictionaries representing rows
        """
        try:
            cursor = self.connection.cursor(dictionary=True)
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            results = cursor.fetchall()
            cursor.close()
            return results
        except Error as e:
            logger.error(f"Error executing query: {e}")
            raise
    
    def get_business_metrics(self) -> np.ndarray:
        """
        Get all business metrics sorted by year and month
        
        Returns:
            Numpy array of total_sales values for training
        """
        try:
            query = """
                SELECT total_sales, total_costs, month, year
                FROM business_metrics
                ORDER BY year ASC, month ASC
            """
            results = self.execute_query(query)
            
            if not results:
                logger.warning("No business metrics found")
                return np.array([])
            
            # Extract sales data
            sales_data = np.array([float(row['total_sales']) for row in results])
            logger.info(f"Retrieved {len(sales_data)} business metrics")
            return sales_data
        except Exception as e:
            logger.error(f"Error retrieving business metrics: {e}")
            raise
    
    def get_cost_metrics(self) -> np.ndarray:
        """
        Get all cost metrics sorted by year and month
        
        Returns:
            Numpy array of total_costs values for training
        """
        try:
            query = """
                SELECT total_costs, month, year
                FROM business_metrics
                ORDER BY year ASC, month ASC
            """
            results = self.execute_query(query)
            
            if not results:
                logger.warning("No cost metrics found")
                return np.array([])
            
            # Extract cost data
            cost_data = np.array([float(row['total_costs']) for row in results])
            logger.info(f"Retrieved {len(cost_data)} cost metrics")
            return cost_data
        except Exception as e:
            logger.error(f"Error retrieving cost metrics: {e}")
            raise
    
    def get_products(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get products from database
        
        Args:
            limit: Maximum number of products to retrieve
        
        Returns:
            List of product records
        """
        try:
            query = "SELECT id, name, category, price FROM products LIMIT %s"
            results = self.execute_query(query, (limit,))
            logger.info(f"Retrieved {len(results)} products")
            return results
        except Exception as e:
            logger.error(f"Error retrieving products: {e}")
            raise
    
    def get_customers(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get customers from database
        
        Args:
            limit: Maximum number of customers to retrieve
        
        Returns:
            List of customer records
        """
        try:
            query = "SELECT id, name, email, segment, country FROM customers LIMIT %s"
            results = self.execute_query(query, (limit,))
            logger.info(f"Retrieved {len(results)} customers")
            return results
        except Exception as e:
            logger.error(f"Error retrieving customers: {e}")
            raise
    
    def get_sales_metrics(self) -> List[Dict[str, Any]]:
        """
        Get sales metrics and aggregated data
        
        Returns:
            List of sales metric records
        """
        try:
            query = """
                SELECT 
                    month, year, total_sales, total_costs, profit
                FROM business_metrics
                ORDER BY year DESC, month DESC
                LIMIT 12
            """
            results = self.execute_query(query)
            logger.info(f"Retrieved {len(results)} sales metrics")
            return results
        except Exception as e:
            logger.error(f"Error retrieving sales metrics: {e}")
            raise
    
    def search_documents(self, keywords: List[str], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search documents by keywords using fulltext search
        
        Args:
            keywords: List of keywords to search for
            limit: Maximum number of results
        
        Returns:
            List of document records with relevance scores
        """
        try:
            # Build search query with multiple keywords
            search_terms = " ".join(keywords)
            
            query = """
                SELECT 
                    id, filename, extracted_text,
                    MATCH(extracted_text) AGAINST(%s IN BOOLEAN MODE) as relevance_score
                FROM documents
                WHERE MATCH(extracted_text) AGAINST(%s IN BOOLEAN MODE)
                AND extraction_status = 'SUCCESS'
                ORDER BY relevance_score DESC
                LIMIT %s
            """
            
            results = self.execute_query(query, (search_terms, search_terms, limit))
            logger.info(f"Found {len(results)} documents matching keywords: {keywords}")
            return results
        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            # Fallback to LIKE search if fulltext search fails
            return self._search_documents_like(keywords, limit)
    
    def _search_documents_like(self, keywords: List[str], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Fallback document search using LIKE operator
        
        Args:
            keywords: List of keywords to search for
            limit: Maximum number of results
        
        Returns:
            List of document records
        """
        try:
            # Build LIKE conditions
            conditions = " OR ".join([f"extracted_text LIKE %s" for _ in keywords])
            like_params = [f"%{kw}%" for kw in keywords]
            
            query = f"""
                SELECT id, filename, extracted_text
                FROM documents
                WHERE ({conditions})
                AND extraction_status = 'SUCCESS'
                LIMIT %s
            """
            
            results = self.execute_query(query, tuple(like_params + [limit]))
            logger.info(f"Found {len(results)} documents using LIKE search")
            return results
        except Exception as e:
            logger.error(f"Error in fallback document search: {e}")
            return []
    
    def get_best_worst_months(self) -> Dict[str, Any]:
        """
        Get best and worst performing months by profit
        
        Returns:
            Dictionary with best_month and worst_month data
        """
        try:
            query = """
                SELECT month, year, profit
                FROM business_metrics
                ORDER BY profit DESC
                LIMIT 1
            """
            best = self.execute_query(query)
            
            query = """
                SELECT month, year, profit
                FROM business_metrics
                ORDER BY profit ASC
                LIMIT 1
            """
            worst = self.execute_query(query)
            
            return {
                "best_month": best[0] if best else None,
                "worst_month": worst[0] if worst else None
            }
        except Exception as e:
            logger.error(f"Error retrieving best/worst months: {e}")
            raise
    
    def get_top_products(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get top products by revenue
        
        Args:
            limit: Number of top products to retrieve
        
        Returns:
            List of top products with revenue
        """
        try:
            query = """
                SELECT 
                    p.id, p.name, p.category,
                    SUM(st.total_amount) as total_revenue
                FROM products p
                JOIN sales_transactions st ON p.id = st.product_id
                GROUP BY p.id, p.name, p.category
                ORDER BY total_revenue DESC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info(f"Retrieved top {len(results)} products")
            return results
        except Exception as e:
            logger.error(f"Error retrieving top products: {e}")
            raise

    def get_top_customers(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get top customers by purchase amount
        
        Args:
            limit: Maximum number of customers to return
        
        Returns:
            List of top customers with purchase information
        """
        try:
            query = """
            SELECT 
                c.id,
                c.name,
                c.segment,
                c.country,
                SUM(st.total_amount) as total_purchases,
                COUNT(st.id) as transaction_count
            FROM customers c
            JOIN sales_transactions st ON c.id = st.customer_id
            GROUP BY c.id, c.name, c.segment, c.country
            ORDER BY total_purchases DESC
            LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info(f"Retrieved {len(results)} top customers")
            return results
        except Error as e:
            logger.error(f"Error getting top customers: {e}")
            raise
    
    def get_sales_for_period(self, year: int, month: int) -> Optional[Dict[str, Any]]:
        """
        Get sales metrics for a specific period
        
        Args:
            year: Year
            month: Month (1-12)
        
        Returns:
            Sales metrics for the period or None if not found
        """
        try:
            query = """
            SELECT year, month, total_sales, total_costs, profit
            FROM business_metrics
            WHERE year = %s AND month = %s
            """
            results = self.execute_query(query, (year, month))
            if results:
                logger.info(f"Retrieved sales for {month}/{year}")
                return results[0]
            logger.info(f"No sales data found for {month}/{year}")
            return None
        except Error as e:
            logger.error(f"Error getting sales for period: {e}")
            raise
    
    def get_product_by_name(self, name_pattern: str) -> List[Dict[str, Any]]:
        """
        Search products by name pattern
        
        Args:
            name_pattern: Pattern to search for in product names
        
        Returns:
            List of matching products
        """
        try:
            query = """
            SELECT id, name, category, price
            FROM products
            WHERE LOWER(name) LIKE LOWER(%s)
            LIMIT 10
            """
            pattern = f"%{name_pattern}%"
            results = self.execute_query(query, (pattern,))
            logger.info(f"Found {len(results)} products matching '{name_pattern}'")
            return results
        except Error as e:
            logger.error(f"Error searching products: {e}")
            raise

    def get_all_sales_metrics(self) -> List[Dict[str, Any]]:
        """Get all business metrics (no limit) for aggregate calculations."""
        try:
            query = """
                SELECT month, year, total_sales, total_costs, profit
                FROM business_metrics
                ORDER BY year DESC, month DESC
            """
            results = self.execute_query(query)
            logger.info("Retrieved %d total sales metrics", len(results))
            return results
        except Error as e:
            logger.error("Error retrieving all sales metrics: %s", e)
            raise

    def get_transaction_count(self, year: int = None, month: int = None) -> int:
        """Count sales transactions, optionally filtered by period."""
        try:
            if year and month:
                query = """
                    SELECT COUNT(*) as cnt FROM sales_transactions
                    WHERE YEAR(transaction_date) = %s AND MONTH(transaction_date) = %s
                """
                results = self.execute_query(query, (year, month))
            elif year:
                query = """
                    SELECT COUNT(*) as cnt FROM sales_transactions
                    WHERE YEAR(transaction_date) = %s
                """
                results = self.execute_query(query, (year,))
            else:
                query = "SELECT COUNT(*) as cnt FROM sales_transactions"
                results = self.execute_query(query)
            return int(results[0]['cnt']) if results else 0
        except Error as e:
            logger.error("Error counting transactions: %s", e)
            raise

    def get_revenue_by_category(self) -> List[Dict[str, Any]]:
        """Get total revenue grouped by product category."""
        try:
            query = """
                SELECT
                    p.category,
                    SUM(st.total_amount) as total_revenue,
                    COUNT(st.id) as transaction_count
                FROM products p
                JOIN sales_transactions st ON p.id = st.product_id
                GROUP BY p.category
                ORDER BY total_revenue DESC
            """
            results = self.execute_query(query)
            logger.info("Retrieved revenue for %d categories", len(results))
            return results
        except Error as e:
            logger.error("Error retrieving revenue by category: %s", e)
            raise

    def get_customers_by_country(self, country: str) -> List[Dict[str, Any]]:
        """Get customers filtered by country."""
        try:
            query = """
                SELECT id, name, email, segment, country
                FROM customers
                WHERE LOWER(country) = LOWER(%s)
                ORDER BY name
            """
            results = self.execute_query(query, (country,))
            logger.info("Found %d customers from %s", len(results), country)
            return results
        except Error as e:
            logger.error("Error retrieving customers by country: %s", e)
            raise

    def get_customers_by_segment(self, segment: str) -> List[Dict[str, Any]]:
        """Get customers filtered by segment."""
        try:
            query = """
                SELECT id, name, email, segment, country
                FROM customers
                WHERE LOWER(segment) = LOWER(%s)
                ORDER BY name
            """
            results = self.execute_query(query, (segment,))
            logger.info("Found %d customers in segment %s", len(results), segment)
            return results
        except Error as e:
            logger.error("Error retrieving customers by segment: %s", e)
            raise

    def get_top_customers_by_orders(self, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top customers ranked by number of transactions."""
        try:
            query = """
                SELECT
                    c.id, c.name, c.segment, c.country,
                    COUNT(st.id) as transaction_count,
                    SUM(st.total_amount) as total_purchases
                FROM customers c
                JOIN sales_transactions st ON c.id = st.customer_id
                GROUP BY c.id, c.name, c.segment, c.country
                ORDER BY transaction_count DESC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info("Retrieved top %d customers by orders", len(results))
            return results
        except Error as e:
            logger.error("Error retrieving top customers by orders: %s", e)
            raise
