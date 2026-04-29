"""
Database connection and query utilities for AI Service.
"""

import logging
import os
from typing import Any, Dict, List, Optional

import numpy as np
import mysql.connector
from mysql.connector import Error

logger = logging.getLogger(__name__)

# SQL constants for long CASE expressions used in product queries
_MARGIN_EXPR = (
    "CASE WHEN p.price > 0 "
    "THEN ((p.price - p.cost) / p.price) * 100 "
    "ELSE 0 END as margin_percentage"
)
_PRODUCT_COLS = (
    "p.id, p.name, p.category, p.price, p.cost, "
    "COALESCE(SUM(st.quantity), 0) as total_units, "
    "COALESCE(SUM(st.total_amount), 0) as total_revenue, "
    "COALESCE(SUM(st.quantity * (p.price - p.cost)), 0) as estimated_profit"
)


class DatabaseConnection:
    """MySQL database connection pool and query utilities."""

    def __init__(
        self,
        host: str = "localhost",
        user: str = "root",
        password: Optional[str] = None,
        database: str = "businessai",
    ) -> None:
        """
        Initialize database connection.

        Args:
            host: MySQL host
            user: MySQL user
            password: MySQL password (defaults to MYSQL_PASSWORD env var)
            database: Database name
        """
        try:
            if password is None:
                password = os.getenv("MYSQL_PASSWORD", "")

            self.connection = mysql.connector.connect(
                host=host,
                user=user,
                password=password,
                database=database,
            )
            logger.info("Database connection established")
        except Error as e:
            logger.error("Error connecting to database: %s", e)
            raise

    def close(self) -> None:
        """Close database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logger.info("Database connection closed")

    def execute_query(
        self,
        query: str,
        params: Optional[tuple] = None,
    ) -> List[Dict[str, Any]]:
        """
        Execute a SELECT query and return results.

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
            logger.error("Error executing query: %s", e)
            raise

    def get_business_metrics(self) -> "np.ndarray":
        """
        Get all business metrics sorted by year and month.

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

            sales_data = np.array(
                [float(row["total_sales"]) for row in results]
            )
            logger.info("Retrieved %d business metrics", len(sales_data))
            return sales_data
        except Exception as e:
            logger.error("Error retrieving business metrics: %s", e)
            raise

    def get_cost_metrics(self) -> "np.ndarray":
        """
        Get all cost metrics sorted by year and month.

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

            cost_data = np.array(
                [float(row["total_costs"]) for row in results]
            )
            logger.info("Retrieved %d cost metrics", len(cost_data))
            return cost_data
        except Exception as e:
            logger.error("Error retrieving cost metrics: %s", e)
            raise

    def get_products(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get products from database.

        Args:
            limit: Maximum number of products to retrieve

        Returns:
            List of product records
        """
        try:
            query = (
                "SELECT id, name, category, price "
                "FROM products LIMIT %s"
            )
            results = self.execute_query(query, (limit,))
            logger.info("Retrieved %d products", len(results))
            return results
        except Exception as e:
            logger.error("Error retrieving products: %s", e)
            raise

    def get_customers(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Get customers from database.

        Args:
            limit: Maximum number of customers to retrieve

        Returns:
            List of customer records
        """
        try:
            query = (
                "SELECT id, name, email, segment, country "
                "FROM customers LIMIT %s"
            )
            results = self.execute_query(query, (limit,))
            logger.info("Retrieved %d customers", len(results))
            return results
        except Exception as e:
            logger.error("Error retrieving customers: %s", e)
            raise

    def get_sales_metrics(self) -> List[Dict[str, Any]]:
        """
        Get sales metrics and aggregated data.

        Returns:
            List of sales metric records
        """
        try:
            query = """
                SELECT month, year, total_sales, total_costs, profit
                FROM business_metrics
                ORDER BY year DESC, month DESC
                LIMIT 12
            """
            results = self.execute_query(query)
            logger.info("Retrieved %d sales metrics", len(results))
            return results
        except Exception as e:
            logger.error("Error retrieving sales metrics: %s", e)
            raise

    def search_documents(
        self,
        keywords: List[str],
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Search documents by keywords using fulltext search.

        Args:
            keywords: List of keywords to search for
            limit: Maximum number of results

        Returns:
            List of document records with relevance scores
        """
        try:
            search_terms = " ".join(keywords)
            query = """
                SELECT
                    id, filename, extracted_text,
                    MATCH(extracted_text)
                        AGAINST(%s IN BOOLEAN MODE) as relevance_score
                FROM documents
                WHERE MATCH(extracted_text) AGAINST(%s IN BOOLEAN MODE)
                AND extraction_status = 'SUCCESS'
                ORDER BY relevance_score DESC
                LIMIT %s
            """
            results = self.execute_query(
                query, (search_terms, search_terms, limit)
            )
            logger.info(
                "Found %d documents matching keywords: %s",
                len(results),
                keywords,
            )
            return results
        except Exception as e:
            logger.error("Error searching documents: %s", e)
            return self._search_documents_like(keywords, limit)

    def _search_documents_like(
        self,
        keywords: List[str],
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Fallback document search using LIKE operator.

        Args:
            keywords: List of keywords to search for
            limit: Maximum number of results

        Returns:
            List of document records
        """
        try:
            placeholders = " OR ".join(
                ["extracted_text LIKE %s" for _ in keywords]
            )
            like_params = [f"%{kw}%" for kw in keywords]
            query = (
                f"SELECT id, filename, extracted_text "
                f"FROM documents "
                f"WHERE ({placeholders}) "
                f"AND extraction_status = 'SUCCESS' "
                f"LIMIT %s"
            )
            results = self.execute_query(
                query, tuple(like_params + [limit])
            )
            logger.info(
                "Found %d documents using LIKE search", len(results)
            )
            return results
        except Exception as e:
            logger.error("Error in fallback document search: %s", e)
            return []

    def get_best_worst_months(self) -> Dict[str, Any]:
        """
        Get best and worst performing months by profit.

        Returns:
            Dictionary with best_month and worst_month data
        """
        try:
            best = self.execute_query(
                """
                SELECT month, year, profit
                FROM business_metrics
                ORDER BY profit DESC
                LIMIT 1
                """
            )
            worst = self.execute_query(
                """
                SELECT month, year, profit
                FROM business_metrics
                ORDER BY profit ASC
                LIMIT 1
                """
            )
            return {
                "best_month": best[0] if best else None,
                "worst_month": worst[0] if worst else None,
            }
        except Exception as e:
            logger.error("Error retrieving best/worst months: %s", e)
            raise

    def get_top_products(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get top products by revenue.

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
            logger.info("Retrieved top %d products", len(results))
            return results
        except Exception as e:
            logger.error("Error retrieving top products: %s", e)
            raise

    def get_top_customers(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get top customers by purchase amount.

        Args:
            limit: Maximum number of customers to return

        Returns:
            List of top customers with purchase information
        """
        try:
            query = """
                SELECT
                    c.id, c.name, c.segment, c.country,
                    SUM(st.total_amount) as total_purchases,
                    COUNT(st.id) as transaction_count
                FROM customers c
                JOIN sales_transactions st ON c.id = st.customer_id
                GROUP BY c.id, c.name, c.segment, c.country
                ORDER BY total_purchases DESC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info("Retrieved %d top customers", len(results))
            return results
        except Error as e:
            logger.error("Error getting top customers: %s", e)
            raise

    def get_sales_for_period(
        self, year: int, month: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get sales metrics for a specific period.

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
                logger.info("Retrieved sales for %d/%d", month, year)
                return results[0]
            logger.info("No sales data found for %d/%d", month, year)
            return None
        except Error as e:
            logger.error("Error getting sales for period: %s", e)
            raise

    def get_product_by_name(
        self, name_pattern: str
    ) -> List[Dict[str, Any]]:
        """
        Search products by name pattern.

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
            logger.info(
                "Found %d products matching '%s'",
                len(results),
                name_pattern,
            )
            return results
        except Error as e:
            logger.error("Error searching products: %s", e)
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

    def get_transaction_count(
        self,
        year: Optional[int] = None,
        month: Optional[int] = None,
    ) -> int:
        """Count sales transactions, optionally filtered by period."""
        try:
            if year and month:
                query = """
                    SELECT COUNT(*) as cnt FROM sales_transactions
                    WHERE YEAR(transaction_date) = %s
                    AND MONTH(transaction_date) = %s
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
            return int(results[0]["cnt"]) if results else 0
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
            logger.info(
                "Retrieved revenue for %d categories", len(results)
            )
            return results
        except Error as e:
            logger.error("Error retrieving revenue by category: %s", e)
            raise

    def get_customers_by_country(
        self, country: str
    ) -> List[Dict[str, Any]]:
        """Get customers filtered by country."""
        try:
            query = """
                SELECT id, name, email, segment, country
                FROM customers
                WHERE LOWER(country) = LOWER(%s)
                ORDER BY name
            """
            results = self.execute_query(query, (country,))
            logger.info(
                "Found %d customers from %s", len(results), country
            )
            return results
        except Error as e:
            logger.error(
                "Error retrieving customers by country: %s", e
            )
            raise

    def get_customers_by_segment(
        self, segment: str
    ) -> List[Dict[str, Any]]:
        """Get customers filtered by segment."""
        try:
            query = """
                SELECT id, name, email, segment, country
                FROM customers
                WHERE LOWER(segment) = LOWER(%s)
                ORDER BY name
            """
            results = self.execute_query(query, (segment,))
            logger.info(
                "Found %d customers in segment %s", len(results), segment
            )
            return results
        except Error as e:
            logger.error(
                "Error retrieving customers by segment: %s", e
            )
            raise

    def get_top_customers_by_orders(
        self, limit: int = 5
    ) -> List[Dict[str, Any]]:
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
            logger.info(
                "Retrieved top %d customers by orders", len(results)
            )
            return results
        except Error as e:
            logger.error(
                "Error retrieving top customers by orders: %s", e
            )
            raise

    def get_highest_transaction(self) -> Optional[Dict[str, Any]]:
        """Get the highest single transaction."""
        try:
            query = """
                SELECT
                    st.id, st.customer_id, st.product_id,
                    st.transaction_date, st.quantity, st.total_amount,
                    c.name as customer_name, p.name as product_name
                FROM sales_transactions st
                JOIN customers c ON st.customer_id = c.id
                JOIN products p ON st.product_id = p.id
                ORDER BY st.total_amount DESC
                LIMIT 1
            """
            results = self.execute_query(query)
            return results[0] if results else None
        except Error as e:
            logger.error("Error retrieving highest transaction: %s", e)
            return None

    def get_top_products_by_revenue(
        self, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get top products by total revenue."""
        try:
            query = f"""
                SELECT {_PRODUCT_COLS}, {_MARGIN_EXPR}
                FROM products p
                LEFT JOIN sales_transactions st ON st.product_id = p.id
                GROUP BY p.id, p.name, p.category, p.price, p.cost
                ORDER BY total_revenue DESC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info(
                "Retrieved top %d products by revenue", len(results)
            )
            return results
        except Error as e:
            logger.error(
                "Error retrieving top products by revenue: %s", e
            )
            return []

    def get_top_products_by_quantity(
        self, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get top products by quantity sold."""
        try:
            query = f"""
                SELECT {_PRODUCT_COLS}, {_MARGIN_EXPR}
                FROM products p
                LEFT JOIN sales_transactions st ON st.product_id = p.id
                GROUP BY p.id, p.name, p.category, p.price, p.cost
                ORDER BY total_units DESC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info(
                "Retrieved top %d products by quantity", len(results)
            )
            return results
        except Error as e:
            logger.error(
                "Error retrieving top products by quantity: %s", e
            )
            return []

    def get_low_margin_high_volume_products(
        self, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get products with high volume but low margin."""
        try:
            query = f"""
                SELECT {_PRODUCT_COLS}, {_MARGIN_EXPR}
                FROM products p
                LEFT JOIN sales_transactions st ON st.product_id = p.id
                GROUP BY p.id, p.name, p.category, p.price, p.cost
                HAVING SUM(st.quantity) > 0
                ORDER BY total_units DESC, margin_percentage ASC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info(
                "Retrieved %d low-margin high-volume products",
                len(results),
            )
            return results
        except Error as e:
            logger.error(
                "Error retrieving low-margin high-volume products: %s", e
            )
            return []

    def get_top_customers_by_revenue(
        self, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get top customers by total revenue."""
        try:
            query = """
                SELECT
                    c.id, c.name, c.segment, c.country,
                    COUNT(st.id) as transaction_count,
                    COALESCE(SUM(st.total_amount), 0) as total_revenue,
                    COALESCE(SUM(st.quantity), 0) as total_quantity,
                    COALESCE(AVG(st.total_amount), 0) as avg_transaction_value
                FROM customers c
                LEFT JOIN sales_transactions st ON st.customer_id = c.id
                GROUP BY c.id, c.name, c.segment, c.country
                ORDER BY total_revenue DESC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info(
                "Retrieved top %d customers by revenue", len(results)
            )
            return results
        except Error as e:
            logger.error(
                "Error retrieving top customers by revenue: %s", e
            )
            return []

    def get_sales_by_day(self) -> List[Dict[str, Any]]:
        """Get sales aggregated by day."""
        try:
            query = """
                SELECT DATE(transaction_date) as sale_date,
                       COUNT(*) as transaction_count,
                       SUM(total_amount) as daily_revenue,
                       SUM(quantity) as daily_units
                FROM sales_transactions
                GROUP BY DATE(transaction_date)
                ORDER BY daily_revenue DESC
                LIMIT 10
            """
            results = self.execute_query(query)
            logger.info("Retrieved sales by day")
            return results
        except Error as e:
            logger.error("Error retrieving sales by day: %s", e)
            return []

    def get_sales_by_month(self) -> List[Dict[str, Any]]:
        """Get sales aggregated by month."""
        try:
            query = """
                SELECT YEAR(transaction_date) as year,
                       MONTH(transaction_date) as month,
                       COUNT(*) as transaction_count,
                       SUM(total_amount) as monthly_revenue,
                       SUM(quantity) as monthly_units
                FROM sales_transactions
                GROUP BY YEAR(transaction_date), MONTH(transaction_date)
                ORDER BY year DESC, month DESC
            """
            results = self.execute_query(query)
            logger.info("Retrieved sales by month")
            return results
        except Error as e:
            logger.error("Error retrieving sales by month: %s", e)
            return []

    def get_small_transactions(
        self, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get smallest transactions."""
        try:
            query = """
                SELECT
                    st.id, st.customer_id, st.product_id,
                    st.transaction_date, st.quantity, st.total_amount,
                    c.name as customer_name, p.name as product_name
                FROM sales_transactions st
                JOIN customers c ON st.customer_id = c.id
                JOIN products p ON st.product_id = p.id
                ORDER BY st.total_amount ASC
                LIMIT %s
            """
            results = self.execute_query(query, (limit,))
            logger.info(
                "Retrieved %d smallest transactions", len(results)
            )
            return results
        except Error as e:
            logger.error("Error retrieving small transactions: %s", e)
            return []

    def get_segment_revenue_analysis(self) -> List[Dict[str, Any]]:
        """Get revenue analysis by customer segment."""
        try:
            query = """
                SELECT c.segment,
                       COUNT(DISTINCT c.id) as customer_count,
                       COUNT(st.id) as transaction_count,
                       COALESCE(SUM(st.total_amount), 0) as total_revenue,
                       COALESCE(AVG(st.total_amount), 0)
                           as avg_transaction_value,
                       CASE WHEN COUNT(DISTINCT c.id) > 0
                            THEN COALESCE(SUM(st.total_amount), 0)
                                 / COUNT(DISTINCT c.id)
                            ELSE 0 END as avg_revenue_per_customer
                FROM customers c
                LEFT JOIN sales_transactions st ON st.customer_id = c.id
                GROUP BY c.segment
                ORDER BY avg_revenue_per_customer DESC
            """
            results = self.execute_query(query)
            logger.info("Retrieved segment revenue analysis")
            return results
        except Error as e:
            logger.error(
                "Error retrieving segment revenue analysis: %s", e
            )
            return []
