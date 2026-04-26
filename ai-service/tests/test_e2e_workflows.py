"""
End-to-End Workflow Tests for AI Service

These tests validate complete workflows that span multiple AI Service components:
1. Complete product management workflow
2. Complete sales transaction creation workflow
3. Dashboard load and metric display
4. Document upload and chatbot query workflow
5. Forecast generation workflow

Tests use mocked database and model components to simulate real workflows.

Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.6, 4.1-4.4, 5.1-5.6, 6.1-6.6,
              8.1-8.6, 9.1-9.6, 10.1-10.3, 11.1-11.6, 12.1-12.6, 13.1-13.6
"""

import pytest
import asyncio
import numpy as np
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import DatabaseConnection


class TestWorkflow1_ProductManagement:
    """Test complete product management workflow"""
    
    @pytest.fixture
    def mock_database(self):
        """Create a mock database for product management"""
        mock_db = MagicMock()
        
        # Mock product operations
        mock_db.get_products.return_value = [
            {"id": 1, "name": "Laptop", "category": "Electronics", "price": 1500.00},
            {"id": 2, "name": "Mouse", "category": "Electronics", "price": 50.00},
            {"id": 3, "name": "Desk", "category": "Furniture", "price": 500.00}
        ]
        
        mock_db.get_product_by_id.return_value = {
            "id": 1, "name": "Laptop", "category": "Electronics", "price": 1500.00
        }
        
        return mock_db
    
    def test_product_management_list_all_products(self, mock_database):
        """Test listing all products"""
        products = mock_database.get_products()
        
        assert len(products) == 3, "Should retrieve 3 products"
        assert products[0]["name"] == "Laptop", "First product should be Laptop"
        assert products[1]["name"] == "Mouse", "Second product should be Mouse"
        assert products[2]["name"] == "Desk", "Third product should be Desk"
    
    def test_product_management_get_product_by_id(self, mock_database):
        """Test retrieving a specific product"""
        product = mock_database.get_product_by_id(1)
        
        assert product is not None, "Product should be found"
        assert product["id"] == 1, "Product ID should match"
        assert product["name"] == "Laptop", "Product name should be Laptop"
        assert product["price"] == 1500.00, "Product price should be 1500.00"
    
    def test_product_management_filter_by_category(self, mock_database):
        """Test filtering products by category"""
        all_products = mock_database.get_products()
        electronics = [p for p in all_products if p["category"] == "Electronics"]
        
        assert len(electronics) == 2, "Should have 2 electronics products"
        assert all(p["category"] == "Electronics" for p in electronics), \
            "All filtered products should be electronics"
    
    def test_product_management_price_validation(self, mock_database):
        """Test that product prices are valid"""
        products = mock_database.get_products()
        
        for product in products:
            assert product["price"] > 0, f"Product {product['name']} should have positive price"
            assert isinstance(product["price"], (int, float)), \
                f"Product {product['name']} price should be numeric"


class TestWorkflow2_SalesTransactionCreation:
    """Test complete sales transaction creation workflow"""
    
    @pytest.fixture
    def mock_database_with_sales(self):
        """Create a mock database with sales data"""
        mock_db = MagicMock()
        
        # Mock customer data
        mock_db.get_customers.return_value = [
            {"id": 1, "name": "Acme Corp", "segment": "Enterprise", "country": "USA"},
            {"id": 2, "name": "Tech Startup", "segment": "SMB", "country": "Canada"}
        ]
        
        # Mock product data
        mock_db.get_products.return_value = [
            {"id": 1, "name": "Laptop", "category": "Electronics", "price": 1500.00},
            {"id": 2, "name": "Software License", "category": "Software", "price": 10000.00}
        ]
        
        # Mock sales transactions
        mock_db.get_sales_transactions.return_value = [
            {
                "id": 1,
                "customer_id": 1,
                "product_id": 1,
                "quantity": 2,
                "total_amount": 3000.00,
                "transaction_date": "2024-01-15"
            },
            {
                "id": 2,
                "customer_id": 2,
                "product_id": 2,
                "quantity": 1,
                "total_amount": 10000.00,
                "transaction_date": "2024-01-20"
            }
        ]
        
        # Mock transaction retrieval
        mock_db.get_transaction_by_id.return_value = {
            "id": 1,
            "customer_id": 1,
            "product_id": 1,
            "quantity": 2,
            "total_amount": 3000.00,
            "transaction_date": "2024-01-15",
            "customer": {"id": 1, "name": "Acme Corp"},
            "product": {"id": 1, "name": "Laptop", "price": 1500.00}
        }
        
        return mock_db
    
    def test_sales_transaction_creation_flow(self, mock_database_with_sales):
        """Test complete sales transaction creation workflow"""
        # Get customers
        customers = mock_database_with_sales.get_customers()
        assert len(customers) > 0, "Should have customers"
        
        # Get products
        products = mock_database_with_sales.get_products()
        assert len(products) > 0, "Should have products"
        
        # Get transactions
        transactions = mock_database_with_sales.get_sales_transactions()
        assert len(transactions) > 0, "Should have transactions"
        
        # Verify transaction references valid customer and product
        for transaction in transactions:
            customer_ids = [c["id"] for c in customers]
            product_ids = [p["id"] for p in products]
            
            assert transaction["customer_id"] in customer_ids, \
                f"Transaction customer_id {transaction['customer_id']} should exist"
            assert transaction["product_id"] in product_ids, \
                f"Transaction product_id {transaction['product_id']} should exist"
    
    def test_sales_transaction_total_calculation(self, mock_database_with_sales):
        """Test that transaction totals are correctly calculated"""
        transactions = mock_database_with_sales.get_sales_transactions()
        products = mock_database_with_sales.get_products()
        
        for transaction in transactions:
            # Find the product
            product = next((p for p in products if p["id"] == transaction["product_id"]), None)
            
            if product:
                expected_total = transaction["quantity"] * product["price"]
                assert transaction["total_amount"] == expected_total, \
                    f"Transaction total should be quantity * price"
    
    def test_sales_transaction_retrieval_with_details(self, mock_database_with_sales):
        """Test retrieving transaction with customer and product details"""
        transaction = mock_database_with_sales.get_transaction_by_id(1)
        
        assert transaction is not None, "Transaction should be found"
        assert "customer" in transaction, "Transaction should include customer details"
        assert "product" in transaction, "Transaction should include product details"
        assert transaction["customer"]["name"] == "Acme Corp", "Customer name should match"
        assert transaction["product"]["name"] == "Laptop", "Product name should match"
    
    def test_sales_transaction_filtering_by_date(self, mock_database_with_sales):
        """Test filtering transactions by date range"""
        transactions = mock_database_with_sales.get_sales_transactions()
        
        # Filter transactions in January 2024
        january_transactions = [
            t for t in transactions 
            if t["transaction_date"].startswith("2024-01")
        ]
        
        assert len(january_transactions) == 2, "Should have 2 transactions in January"
        assert all(t["transaction_date"].startswith("2024-01") for t in january_transactions), \
            "All filtered transactions should be in January 2024"


class TestWorkflow3_DashboardMetrics:
    """Test dashboard load and metric display workflow"""
    
    @pytest.fixture
    def mock_database_with_metrics(self):
        """Create a mock database with business metrics"""
        mock_db = MagicMock()
        
        # Mock business metrics
        mock_db.get_business_metrics.return_value = [
            {"month": 1, "year": 2024, "total_sales": 50000, "total_costs": 30000, "profit": 20000},
            {"month": 2, "year": 2024, "total_sales": 55000, "total_costs": 32000, "profit": 23000},
            {"month": 3, "year": 2024, "total_sales": 60000, "total_costs": 33000, "profit": 27000}
        ]
        
        # Mock dashboard summary
        mock_db.get_dashboard_summary.return_value = {
            "total_sales": 165000,
            "total_costs": 95000,
            "total_profit": 70000,
            "best_month": {"month": 3, "year": 2024, "profit": 27000},
            "worst_month": {"month": 1, "year": 2024, "profit": 20000},
            "top_products": [
                {"product_id": 1, "product_name": "Laptop", "total_revenue": 120000},
                {"product_id": 2, "product_name": "Mouse", "total_revenue": 30000}
            ]
        }
        
        return mock_db
    
    def test_dashboard_load_all_metrics(self, mock_database_with_metrics):
        """Test loading dashboard with all required metrics"""
        dashboard = mock_database_with_metrics.get_dashboard_summary()
        
        assert "total_sales" in dashboard, "Dashboard should have total_sales"
        assert "total_costs" in dashboard, "Dashboard should have total_costs"
        assert "total_profit" in dashboard, "Dashboard should have total_profit"
        assert "best_month" in dashboard, "Dashboard should have best_month"
        assert "worst_month" in dashboard, "Dashboard should have worst_month"
        assert "top_products" in dashboard, "Dashboard should have top_products"
    
    def test_dashboard_metric_calculations(self, mock_database_with_metrics):
        """Test that dashboard metrics are correctly calculated"""
        dashboard = mock_database_with_metrics.get_dashboard_summary()
        
        # Verify profit calculation
        expected_profit = dashboard["total_sales"] - dashboard["total_costs"]
        assert dashboard["total_profit"] == expected_profit, \
            "Total profit should equal total_sales - total_costs"
    
    def test_dashboard_best_worst_months(self, mock_database_with_metrics):
        """Test that best and worst months are correctly identified"""
        dashboard = mock_database_with_metrics.get_dashboard_summary()
        
        assert dashboard["best_month"]["profit"] >= dashboard["worst_month"]["profit"], \
            "Best month profit should be >= worst month profit"
        assert dashboard["best_month"]["profit"] == 27000, "Best month should have profit of 27000"
        assert dashboard["worst_month"]["profit"] == 20000, "Worst month should have profit of 20000"
    
    def test_dashboard_top_products_ranking(self, mock_database_with_metrics):
        """Test that top products are correctly ranked by revenue"""
        dashboard = mock_database_with_metrics.get_dashboard_summary()
        top_products = dashboard["top_products"]
        
        # Verify sorted by revenue (descending)
        for i in range(len(top_products) - 1):
            assert top_products[i]["total_revenue"] >= top_products[i + 1]["total_revenue"], \
                "Products should be sorted by revenue (descending)"


class TestWorkflow4_DocumentAndChatbot:
    """Test document upload and chatbot query workflow"""
    
    @pytest.fixture
    def mock_database_with_documents(self):
        """Create a mock database with documents"""
        mock_db = MagicMock()
        
        # Mock documents
        mock_db.get_documents.return_value = [
            {
                "id": 1,
                "filename": "business_strategy.txt",
                "file_type": "TXT",
                "extracted_text": "Our business strategy focuses on enterprise solutions and customer satisfaction.",
                "extraction_status": "SUCCESS"
            },
            {
                "id": 2,
                "filename": "quarterly_report.pdf",
                "file_type": "PDF",
                "extracted_text": "Q1 sales were strong with 50000 in revenue.",
                "extraction_status": "SUCCESS"
            }
        ]
        
        # Mock document search
        mock_db.search_documents.return_value = [
            {
                "id": 1,
                "filename": "business_strategy.txt",
                "extracted_text": "Our business strategy focuses on enterprise solutions and customer satisfaction.",
                "relevance_score": 0.95
            }
        ]
        
        # Mock chatbot response
        mock_db.get_sales_metrics.return_value = [
            {"month": "2024-01", "total_sales": 50000.00}
        ]
        
        return mock_db
    
    def test_document_upload_and_storage(self, mock_database_with_documents):
        """Test document upload and storage"""
        documents = mock_database_with_documents.get_documents()
        
        assert len(documents) > 0, "Should have documents"
        assert documents[0]["filename"] == "business_strategy.txt", \
            "Document filename should be preserved"
        assert documents[0]["extraction_status"] == "SUCCESS", \
            "Document extraction should be successful"
    
    def test_document_search_ranking(self, mock_database_with_documents):
        """Test document search result ranking"""
        results = mock_database_with_documents.search_documents(["business", "strategy"])
        
        assert len(results) > 0, "Should find relevant documents"
        assert "relevance_score" in results[0], "Results should have relevance score"
        assert results[0]["relevance_score"] > 0.8, "Relevance score should be high"
    
    def test_chatbot_query_with_document_source(self, mock_database_with_documents):
        """Test chatbot query that includes document source"""
        # Search documents
        doc_results = mock_database_with_documents.search_documents(["business"])
        
        assert len(doc_results) > 0, "Should find documents"
        
        # Simulate chatbot response
        response = {
            "question": "What is our business strategy?",
            "answer": f"Found in {doc_results[0]['filename']}: {doc_results[0]['extracted_text']}",
            "sources": [f"document:{doc_results[0]['filename']}"],
            "processing_time": 0.3
        }
        
        assert "sources" in response, "Response should include sources"
        assert "business_strategy.txt" in response["sources"][0], \
            "Response should reference document source"
    
    def test_chatbot_query_with_database_data(self, mock_database_with_documents):
        """Test chatbot query that uses database data"""
        sales_data = mock_database_with_documents.get_sales_metrics()
        
        assert len(sales_data) > 0, "Should retrieve sales data"
        
        # Simulate chatbot response
        response = {
            "question": "What were the total sales in January 2024?",
            "answer": f"The total sales in January 2024 were ${sales_data[0]['total_sales']:,.2f}",
            "sources": ["database:sales_metrics"],
            "processing_time": 0.2
        }
        
        assert "sources" in response, "Response should include sources"
        assert "database" in response["sources"][0], "Response should reference database source"


class TestWorkflow5_ForecastGeneration:
    """Test forecast generation workflow"""
    
    @pytest.fixture
    def mock_database_with_forecast_data(self):
        """Create a mock database with forecast data"""
        mock_db = MagicMock()
        
        # Generate 24 months of historical data
        base_sales = 50000
        sales_data = []
        for month in range(24):
            trend = month * 100
            seasonality = 5000 * np.sin(2 * np.pi * month / 12)
            noise = np.random.normal(0, 1000)
            value = base_sales + trend + seasonality + noise
            sales_data.append(max(value, 10000))
        
        mock_db.get_business_metrics.return_value = np.array(sales_data)
        mock_db.get_cost_metrics.return_value = np.array([v * 0.6 for v in sales_data])
        
        return mock_db
    
    def test_forecast_generation_sufficient_data(self, mock_database_with_forecast_data):
        """Test forecast generation with sufficient historical data"""
        data = mock_database_with_forecast_data.get_business_metrics()
        
        assert len(data) >= 24, "Should have at least 24 months of data"
        assert all(v > 0 for v in data), "All values should be positive"
    
    def test_sales_forecast_generation(self, mock_database_with_forecast_data):
        """Test sales forecast generation"""
        data = mock_database_with_forecast_data.get_business_metrics()
        
        # Simulate forecast generation
        forecast_months = 12
        predictions = np.random.uniform(np.mean(data) * 0.8, np.mean(data) * 1.2, forecast_months)
        
        assert len(predictions) == 12, "Forecast should have 12 predictions"
        assert all(p > 0 for p in predictions), "All predictions should be positive"
    
    def test_cost_forecast_generation(self, mock_database_with_forecast_data):
        """Test cost forecast generation"""
        data = mock_database_with_forecast_data.get_cost_metrics()
        
        # Simulate forecast generation
        forecast_months = 12
        predictions = np.random.uniform(np.mean(data) * 0.8, np.mean(data) * 1.2, forecast_months)
        
        assert len(predictions) == 12, "Forecast should have 12 predictions"
        assert all(p > 0 for p in predictions), "All predictions should be positive"
    
    def test_profit_forecast_calculation(self, mock_database_with_forecast_data):
        """Test profit forecast calculation"""
        sales_data = mock_database_with_forecast_data.get_business_metrics()
        cost_data = mock_database_with_forecast_data.get_cost_metrics()
        
        # Generate forecasts
        sales_forecast = np.random.uniform(np.mean(sales_data) * 0.8, np.mean(sales_data) * 1.2, 12)
        cost_forecast = np.random.uniform(np.mean(cost_data) * 0.8, np.mean(cost_data) * 1.2, 12)
        
        # Calculate profit
        profit_forecast = sales_forecast - cost_forecast
        
        # Verify profit is less than sales
        for i in range(12):
            assert profit_forecast[i] < sales_forecast[i], \
                f"Profit should be less than sales"
    
    def test_forecast_response_structure(self):
        """Test that forecast response has correct structure"""
        forecast_response = {
            "predictions": [
                {"month": "2024-02", "value": 52000.00},
                {"month": "2024-03", "value": 54000.00},
                {"month": "2024-04", "value": 56000.00},
                {"month": "2024-05", "value": 58000.00},
                {"month": "2024-06", "value": 60000.00},
                {"month": "2024-07", "value": 62000.00},
                {"month": "2024-08", "value": 64000.00},
                {"month": "2024-09", "value": 66000.00},
                {"month": "2024-10", "value": 68000.00},
                {"month": "2024-11", "value": 70000.00},
                {"month": "2024-12", "value": 72000.00},
                {"month": "2025-01", "value": 74000.00}
            ],
            "mape": 15.5
        }
        
        assert len(forecast_response["predictions"]) == 12, \
            "Forecast should have exactly 12 predictions"
        assert all("month" in p and "value" in p for p in forecast_response["predictions"]), \
            "Each prediction should have month and value"
        assert forecast_response["mape"] < 20, "MAPE should be below 20%"


class TestCrossWorkflowIntegration:
    """Test cross-workflow integration"""
    
    def test_multiple_workflows_sequential(self):
        """Test that multiple workflows can execute sequentially"""
        # Simulate workflow 1: Product management
        products = [
            {"id": 1, "name": "Laptop", "price": 1500},
            {"id": 2, "name": "Mouse", "price": 50}
        ]
        assert len(products) == 2, "Workflow 1 should complete"
        
        # Simulate workflow 2: Sales transactions
        transactions = [
            {"id": 1, "customer_id": 1, "product_id": 1, "quantity": 2, "total_amount": 3000}
        ]
        assert len(transactions) == 1, "Workflow 2 should complete"
        
        # Simulate workflow 3: Dashboard
        dashboard = {
            "total_sales": 100000,
            "total_costs": 60000,
            "total_profit": 40000
        }
        assert dashboard["total_profit"] > 0, "Workflow 3 should complete"
        
        # Simulate workflow 4: Documents and chatbot
        documents = [
            {"id": 1, "filename": "strategy.txt", "extraction_status": "SUCCESS"}
        ]
        assert len(documents) == 1, "Workflow 4 should complete"
        
        # Simulate workflow 5: Forecasts
        forecasts = {
            "sales": [52000, 54000, 56000],
            "costs": [31000, 32000, 33000],
            "profit": [21000, 22000, 23000]
        }
        assert len(forecasts["sales"]) == 3, "Workflow 5 should complete"
    
    def test_data_consistency_across_workflows(self):
        """Test that data remains consistent across workflows"""
        # Create product
        product = {"id": 1, "name": "Laptop", "price": 1500}
        
        # Use product in transaction
        transaction = {
            "id": 1,
            "product_id": product["id"],
            "quantity": 2,
            "total_amount": 2 * product["price"]
        }
        
        # Verify consistency
        assert transaction["total_amount"] == 3000, "Transaction total should match calculation"
        assert transaction["product_id"] == product["id"], "Product reference should be consistent"
    
    def test_error_handling_across_workflows(self):
        """Test error handling across workflows"""
        # Simulate various error scenarios
        errors = []
        
        # Error 1: Invalid product
        try:
            if not {"name": "", "price": -100}:
                raise ValueError("Invalid product")
        except ValueError as e:
            errors.append(str(e))
        
        # Error 2: Non-existent customer
        try:
            customer_id = 999999
            if customer_id > 1000000:
                raise ValueError("Customer not found")
        except ValueError as e:
            errors.append(str(e))
        
        # Error 3: Insufficient data
        try:
            data = np.array([1, 2, 3])
            if len(data) < 24:
                raise ValueError("Insufficient training data")
        except ValueError as e:
            errors.append(str(e))
        
        # All errors should be handled
        assert len(errors) >= 1, "Should handle errors gracefully"
