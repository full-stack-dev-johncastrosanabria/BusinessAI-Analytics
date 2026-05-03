"""
Comprehensive tests for database.py to achieve ≥80% coverage.
All MySQL calls are mocked — no real DB connection required.
"""
import pytest
from unittest.mock import MagicMock, patch, PropertyMock
import numpy as np

from database import DatabaseConnection


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_db(query_results=None):
    """Return a DatabaseConnection whose mysql connection is fully mocked."""
    with patch("database.mysql.connector.connect") as mock_connect:
        mock_conn = MagicMock()
        mock_connect.return_value = mock_conn
        db = DatabaseConnection(
            host="localhost", user="root", password="pw", database="test"
        )
    # Patch execute_query so we don't need a real cursor
    if query_results is not None:
        db.execute_query = MagicMock(return_value=query_results)
    return db


# ---------------------------------------------------------------------------
# __init__ / close
# ---------------------------------------------------------------------------

class TestInit:
    def test_successful_connection(self):
        with patch("database.mysql.connector.connect") as mock_connect:
            mock_connect.return_value = MagicMock()
            db = DatabaseConnection(password="pw")
            assert db.connection is not None

    def test_uses_env_password_when_none(self):
        with patch("database.mysql.connector.connect") as mock_connect, \
             patch("database.os.getenv", return_value="envpw"):
            mock_connect.return_value = MagicMock()
            db = DatabaseConnection()
            mock_connect.assert_called_once()

    def test_raises_on_connection_error(self):
        from mysql.connector import Error
        with patch("database.mysql.connector.connect", side_effect=Error("fail")):
            with pytest.raises(Error):
                DatabaseConnection(password="pw")

    def test_close_connected(self):
        db = _make_db()
        db.connection.is_connected.return_value = True
        db.close()
        db.connection.close.assert_called_once()

    def test_close_not_connected(self):
        db = _make_db()
        db.connection.is_connected.return_value = False
        db.close()  # should not raise
        db.connection.close.assert_not_called()


# ---------------------------------------------------------------------------
# execute_query
# ---------------------------------------------------------------------------

class TestExecuteQuery:
    def test_returns_results(self):
        db = _make_db()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = [{"id": 1}]
        db.connection.cursor.return_value = mock_cursor

        result = db.execute_query("SELECT 1")
        assert result == [{"id": 1}]

    def test_with_params(self):
        db = _make_db()
        mock_cursor = MagicMock()
        mock_cursor.fetchall.return_value = []
        db.connection.cursor.return_value = mock_cursor

        result = db.execute_query("SELECT * FROM t WHERE id=%s", (1,))
        mock_cursor.execute.assert_called_once_with("SELECT * FROM t WHERE id=%s", (1,))
        assert result == []

    def test_raises_on_error(self):
        from mysql.connector import Error
        db = _make_db()
        mock_cursor = MagicMock()
        mock_cursor.execute.side_effect = Error("bad query")
        db.connection.cursor.return_value = mock_cursor

        with pytest.raises(Error):
            db.execute_query("BAD SQL")


# ---------------------------------------------------------------------------
# get_business_metrics
# ---------------------------------------------------------------------------

class TestGetBusinessMetrics:
    def test_returns_numpy_array(self):
        rows = [
            {"total_sales": 1000.0, "total_costs": 500.0, "month": 1, "year": 2024},
            {"total_sales": 2000.0, "total_costs": 800.0, "month": 2, "year": 2024},
        ]
        db = _make_db(rows)
        result = db.get_business_metrics()
        assert isinstance(result, np.ndarray)
        assert len(result) == 2
        np.testing.assert_array_almost_equal(result, [1000.0, 2000.0])

    def test_empty_returns_empty_array(self):
        db = _make_db([])
        result = db.get_business_metrics()
        assert isinstance(result, np.ndarray)
        assert len(result) == 0

    def test_raises_on_exception(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("db error"))
        with pytest.raises(Exception):
            db.get_business_metrics()


# ---------------------------------------------------------------------------
# get_cost_metrics
# ---------------------------------------------------------------------------

class TestGetCostMetrics:
    def test_returns_numpy_array(self):
        rows = [
            {"total_costs": 500.0, "month": 1, "year": 2024},
            {"total_costs": 800.0, "month": 2, "year": 2024},
        ]
        db = _make_db(rows)
        result = db.get_cost_metrics()
        assert isinstance(result, np.ndarray)
        np.testing.assert_array_almost_equal(result, [500.0, 800.0])

    def test_empty_returns_empty_array(self):
        db = _make_db([])
        result = db.get_cost_metrics()
        assert len(result) == 0

    def test_raises_on_exception(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("err"))
        with pytest.raises(Exception):
            db.get_cost_metrics()


# ---------------------------------------------------------------------------
# get_products
# ---------------------------------------------------------------------------

class TestGetProducts:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Widget", "category": "A", "price": 9.99}]
        db = _make_db(rows)
        result = db.get_products(limit=10)
        assert result == rows

    def test_raises_on_exception(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("err"))
        with pytest.raises(Exception):
            db.get_products()


# ---------------------------------------------------------------------------
# get_customers
# ---------------------------------------------------------------------------

class TestGetCustomers:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Alice", "email": "a@b.com",
                 "segment": "VIP", "country": "US"}]
        db = _make_db(rows)
        result = db.get_customers(limit=50)
        assert result == rows

    def test_raises_on_exception(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("err"))
        with pytest.raises(Exception):
            db.get_customers()


# ---------------------------------------------------------------------------
# get_sales_metrics
# ---------------------------------------------------------------------------

class TestGetSalesMetrics:
    def test_returns_list(self):
        rows = [{"month": 1, "year": 2024, "total_sales": 5000,
                 "total_costs": 3000, "profit": 2000}]
        db = _make_db(rows)
        result = db.get_sales_metrics()
        assert result == rows

    def test_raises_on_exception(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("err"))
        with pytest.raises(Exception):
            db.get_sales_metrics()


# ---------------------------------------------------------------------------
# search_documents / _search_documents_like
# ---------------------------------------------------------------------------

class TestSearchDocuments:
    def test_fulltext_search_returns_results(self):
        rows = [{"id": 1, "filename": "doc.pdf", "extracted_text": "hello",
                 "relevance_score": 1.0}]
        db = _make_db(rows)
        result = db.search_documents(["hello"], limit=5)
        assert result == rows

    def test_falls_back_to_like_on_exception(self):
        db = _make_db()
        like_rows = [{"id": 2, "filename": "doc2.pdf", "extracted_text": "world"}]
        call_count = [0]

        def side_effect(query, params=None):
            call_count[0] += 1
            if call_count[0] == 1:
                raise Exception("fulltext not supported")
            return like_rows

        db.execute_query = MagicMock(side_effect=side_effect)
        result = db.search_documents(["world"], limit=5)
        assert result == like_rows

    def test_like_fallback_returns_empty_on_error(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("always fails"))
        result = db.search_documents(["term"], limit=5)
        assert result == []

    def test_search_documents_like_directly(self):
        rows = [{"id": 3, "filename": "f.pdf", "extracted_text": "content"}]
        db = _make_db(rows)
        result = db._search_documents_like(["content"], limit=3)
        assert result == rows

    def test_search_documents_like_error_returns_empty(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("err"))
        result = db._search_documents_like(["x"], limit=3)
        assert result == []


# ---------------------------------------------------------------------------
# get_best_worst_months
# ---------------------------------------------------------------------------

class TestGetBestWorstMonths:
    def test_returns_dict_with_best_and_worst(self):
        best_row = [{"month": 6, "year": 2024, "profit": 25000}]
        worst_row = [{"month": 2, "year": 2024, "profit": 1000}]
        db = _make_db()
        db.execute_query = MagicMock(side_effect=[best_row, worst_row])
        result = db.get_best_worst_months()
        assert result["best_month"]["profit"] == 25000
        assert result["worst_month"]["profit"] == 1000

    def test_returns_none_when_empty(self):
        db = _make_db()
        db.execute_query = MagicMock(return_value=[])
        result = db.get_best_worst_months()
        assert result["best_month"] is None
        assert result["worst_month"] is None

    def test_raises_on_exception(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("err"))
        with pytest.raises(Exception):
            db.get_best_worst_months()


# ---------------------------------------------------------------------------
# get_top_products / get_top_customers
# ---------------------------------------------------------------------------

class TestGetTopProducts:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Widget", "category": "A",
                 "total_revenue": 50000}]
        db = _make_db(rows)
        result = db.get_top_products(limit=5)
        assert result == rows

    def test_raises_on_exception(self):
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Exception("err"))
        with pytest.raises(Exception):
            db.get_top_products()


class TestGetTopCustomers:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Alice", "segment": "VIP",
                 "country": "US", "total_purchases": 10000,
                 "transaction_count": 5}]
        db = _make_db(rows)
        result = db.get_top_customers(limit=5)
        assert result == rows

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_top_customers()


# ---------------------------------------------------------------------------
# get_sales_for_period
# ---------------------------------------------------------------------------

class TestGetSalesForPeriod:
    def test_returns_record_when_found(self):
        row = {"year": 2024, "month": 1, "total_sales": 5000,
               "total_costs": 3000, "profit": 2000}
        db = _make_db([row])
        result = db.get_sales_for_period(2024, 1)
        assert result == row

    def test_returns_none_when_not_found(self):
        db = _make_db([])
        result = db.get_sales_for_period(2024, 1)
        assert result is None

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_sales_for_period(2024, 1)


# ---------------------------------------------------------------------------
# get_product_by_name
# ---------------------------------------------------------------------------

class TestGetProductByName:
    def test_returns_matching_products(self):
        rows = [{"id": 1, "name": "Widget Pro", "category": "A", "price": 9.99}]
        db = _make_db(rows)
        result = db.get_product_by_name("widget")
        assert result == rows

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_product_by_name("x")


# ---------------------------------------------------------------------------
# get_all_sales_metrics
# ---------------------------------------------------------------------------

class TestGetAllSalesMetrics:
    def test_returns_all_rows(self):
        rows = [{"month": i, "year": 2024, "total_sales": i * 1000,
                 "total_costs": i * 500, "profit": i * 500}
                for i in range(1, 13)]
        db = _make_db(rows)
        result = db.get_all_sales_metrics()
        assert len(result) == 12

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_all_sales_metrics()


# ---------------------------------------------------------------------------
# get_transaction_count
# ---------------------------------------------------------------------------

class TestGetTransactionCount:
    def test_count_all(self):
        db = _make_db([{"cnt": 42}])
        result = db.get_transaction_count()
        assert result == 42

    def test_count_by_year(self):
        db = _make_db([{"cnt": 10}])
        result = db.get_transaction_count(year=2024)
        assert result == 10

    def test_count_by_year_and_month(self):
        db = _make_db([{"cnt": 5}])
        result = db.get_transaction_count(year=2024, month=1)
        assert result == 5

    def test_returns_zero_when_empty(self):
        db = _make_db([])
        result = db.get_transaction_count()
        assert result == 0

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_transaction_count()


# ---------------------------------------------------------------------------
# get_revenue_by_category
# ---------------------------------------------------------------------------

class TestGetRevenueByCategory:
    def test_returns_list(self):
        rows = [{"category": "Electronics", "total_revenue": 50000,
                 "transaction_count": 100}]
        db = _make_db(rows)
        result = db.get_revenue_by_category()
        assert result == rows

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_revenue_by_category()


# ---------------------------------------------------------------------------
# get_customers_by_country / get_customers_by_segment
# ---------------------------------------------------------------------------

class TestGetCustomersByCountry:
    def test_returns_customers(self):
        rows = [{"id": 1, "name": "Alice", "email": "a@b.com",
                 "segment": "VIP", "country": "US"}]
        db = _make_db(rows)
        result = db.get_customers_by_country("US")
        assert result == rows

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_customers_by_country("US")


class TestGetCustomersBySegment:
    def test_returns_customers(self):
        rows = [{"id": 2, "name": "Bob", "email": "b@c.com",
                 "segment": "Enterprise", "country": "UK"}]
        db = _make_db(rows)
        result = db.get_customers_by_segment("Enterprise")
        assert result == rows

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_customers_by_segment("Enterprise")


# ---------------------------------------------------------------------------
# get_top_customers_by_orders
# ---------------------------------------------------------------------------

class TestGetTopCustomersByOrders:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Alice", "segment": "VIP",
                 "country": "US", "transaction_count": 20,
                 "total_purchases": 50000}]
        db = _make_db(rows)
        result = db.get_top_customers_by_orders(limit=5)
        assert result == rows

    def test_raises_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        with pytest.raises(Error):
            db.get_top_customers_by_orders()


# ---------------------------------------------------------------------------
# get_highest_transaction
# ---------------------------------------------------------------------------

class TestGetHighestTransaction:
    def test_returns_transaction(self):
        row = {"id": 1, "customer_id": 1, "product_id": 1,
               "transaction_date": "2024-01-15", "quantity": 10,
               "total_amount": 9999.99, "customer_name": "Alice",
               "product_name": "Widget"}
        db = _make_db([row])
        result = db.get_highest_transaction()
        assert result == row

    def test_returns_none_when_empty(self):
        db = _make_db([])
        result = db.get_highest_transaction()
        assert result is None

    def test_returns_none_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_highest_transaction()
        assert result is None


# ---------------------------------------------------------------------------
# get_top_products_by_revenue / quantity / low_margin
# ---------------------------------------------------------------------------

class TestGetTopProductsByRevenue:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Widget", "total_revenue": 50000}]
        db = _make_db(rows)
        result = db.get_top_products_by_revenue(limit=5)
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_top_products_by_revenue()
        assert result == []


class TestGetTopProductsByQuantity:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Widget", "total_units": 500}]
        db = _make_db(rows)
        result = db.get_top_products_by_quantity(limit=5)
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_top_products_by_quantity()
        assert result == []


class TestGetLowMarginHighVolumeProducts:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Cheap Widget", "total_units": 1000,
                 "margin_percentage": 5.0}]
        db = _make_db(rows)
        result = db.get_low_margin_high_volume_products(limit=5)
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_low_margin_high_volume_products()
        assert result == []


# ---------------------------------------------------------------------------
# get_top_customers_by_revenue
# ---------------------------------------------------------------------------

class TestGetTopCustomersByRevenue:
    def test_returns_list(self):
        rows = [{"id": 1, "name": "Alice", "segment": "VIP",
                 "country": "US", "transaction_count": 10,
                 "total_revenue": 100000, "total_quantity": 50,
                 "avg_transaction_value": 10000}]
        db = _make_db(rows)
        result = db.get_top_customers_by_revenue(limit=5)
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_top_customers_by_revenue()
        assert result == []


# ---------------------------------------------------------------------------
# get_sales_by_day / get_sales_by_month
# ---------------------------------------------------------------------------

class TestGetSalesByDay:
    def test_returns_list(self):
        rows = [{"sale_date": "2024-01-15", "transaction_count": 5,
                 "daily_revenue": 5000, "daily_units": 10}]
        db = _make_db(rows)
        result = db.get_sales_by_day()
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_sales_by_day()
        assert result == []


class TestGetSalesByMonth:
    def test_returns_list(self):
        rows = [{"year": 2024, "month": 1, "transaction_count": 50,
                 "monthly_revenue": 50000, "monthly_units": 100}]
        db = _make_db(rows)
        result = db.get_sales_by_month()
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_sales_by_month()
        assert result == []


# ---------------------------------------------------------------------------
# get_small_transactions
# ---------------------------------------------------------------------------

class TestGetSmallTransactions:
    def test_returns_list(self):
        rows = [{"id": 1, "customer_id": 1, "product_id": 1,
                 "transaction_date": "2024-01-01", "quantity": 1,
                 "total_amount": 5.99, "customer_name": "Alice",
                 "product_name": "Sticker"}]
        db = _make_db(rows)
        result = db.get_small_transactions(limit=10)
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_small_transactions()
        assert result == []


# ---------------------------------------------------------------------------
# get_segment_revenue_analysis
# ---------------------------------------------------------------------------

class TestGetSegmentRevenueAnalysis:
    def test_returns_list(self):
        rows = [{"segment": "VIP", "customer_count": 10,
                 "transaction_count": 100, "total_revenue": 500000,
                 "avg_transaction_value": 5000,
                 "avg_revenue_per_customer": 50000}]
        db = _make_db(rows)
        result = db.get_segment_revenue_analysis()
        assert result == rows

    def test_returns_empty_on_mysql_error(self):
        from mysql.connector import Error
        db = _make_db()
        db.execute_query = MagicMock(side_effect=Error("err"))
        result = db.get_segment_revenue_analysis()
        assert result == []
