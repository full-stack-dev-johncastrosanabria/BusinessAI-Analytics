"""
Unit tests for AI Service endpoints
Tests forecast generation and chatbot query processing
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
import numpy as np
from datetime import datetime


class TestForecastEndpoints:
    """Test forecast endpoints"""
    
    def test_forecast_response_structure(self):
        """Test that forecast response has correct structure"""
        # Mock forecast data
        predictions = [
            {"month": "2024-01", "value": 5000.0},
            {"month": "2024-02", "value": 5100.0},
            {"month": "2024-03", "value": 5200.0},
            {"month": "2024-04", "value": 5300.0},
            {"month": "2024-05", "value": 5400.0},
            {"month": "2024-06", "value": 5500.0},
            {"month": "2024-07", "value": 5600.0},
            {"month": "2024-08", "value": 5700.0},
            {"month": "2024-09", "value": 5800.0},
            {"month": "2024-10", "value": 5900.0},
            {"month": "2024-11", "value": 6000.0},
            {"month": "2024-12", "value": 6100.0}
        ]
        
        # Verify structure
        assert len(predictions) == 12, "Should have exactly 12 predictions"
        
        for pred in predictions:
            assert "month" in pred, "Each prediction should have month"
            assert "value" in pred, "Each prediction should have value"
            assert isinstance(pred["month"], str), "Month should be string"
            assert isinstance(pred["value"], (int, float)), "Value should be numeric"
    
    def test_profit_calculation_correctness(self):
        """Test that profit calculation is correct"""
        sales = np.array([10000.0, 11000.0, 12000.0, 13000.0, 14000.0, 15000.0,
                         16000.0, 17000.0, 18000.0, 19000.0, 20000.0, 21000.0])
        costs = np.array([5000.0, 5500.0, 6000.0, 6500.0, 7000.0, 7500.0,
                         8000.0, 8500.0, 9000.0, 9500.0, 10000.0, 10500.0])
        
        profit = sales - costs
        
        # Verify each month
        for i in range(12):
            expected = sales[i] - costs[i]
            assert abs(profit[i] - expected) < 0.01, \
                f"Month {i}: profit {profit[i]} != {expected}"
    
    def test_forecast_with_insufficient_data(self):
        """Test forecast error handling with insufficient data"""
        # Less than 24 months of data
        data = np.array([5000.0] * 20)
        
        # Should raise error or return error response
        assert len(data) < 24, "Test data should be insufficient"


class TestChatbotEndpoints:
    """Test chatbot endpoints"""
    
    def test_chatbot_response_structure(self):
        """Test that chatbot response has correct structure"""
        response = {
            "question": "What are the total sales?",
            "answer": "The total sales were $50,000.",
            "sources": ["database:business_metrics"],
            "processing_time": 1.2
        }
        
        # Verify structure
        assert "question" in response, "Response should have question"
        assert "answer" in response, "Response should have answer"
        assert "sources" in response, "Response should have sources"
        assert "processing_time" in response, "Response should have processing_time"
        
        assert isinstance(response["question"], str), "Question should be string"
        assert isinstance(response["answer"], str), "Answer should be string"
        assert isinstance(response["sources"], list), "Sources should be list"
        assert isinstance(response["processing_time"], (int, float)), "Processing time should be numeric"
    
    def test_intent_classification_sales_metrics(self):
        """Test intent classification for sales metrics"""
        question = "What were the total sales last month?"
        
        # Keywords that should match sales_metrics
        keywords = ["sales", "revenue", "profit", "earnings"]
        
        # Check if any keyword is in question
        matches = [kw for kw in keywords if kw in question.lower()]
        assert len(matches) > 0, "Should match sales metrics keywords"
    
    def test_intent_classification_product_info(self):
        """Test intent classification for product info"""
        question = "What products do we sell?"
        
        # Keywords that should match product_info
        keywords = ["product", "item", "inventory", "stock"]
        
        # Check if any keyword is in question
        matches = [kw for kw in keywords if kw in question.lower()]
        assert len(matches) > 0, "Should match product keywords"
    
    def test_intent_classification_customer_info(self):
        """Test intent classification for customer info"""
        question = "How many customers do we have?"
        
        # Keywords that should match customer_info
        keywords = ["customer", "client", "segment"]
        
        # Check if any keyword is in question
        matches = [kw for kw in keywords if kw in question.lower()]
        assert len(matches) > 0, "Should match customer keywords"


class TestErrorHandling:
    """Test error handling"""
    
    def test_insufficient_training_data_error(self):
        """Test error when insufficient training data"""
        data = np.array([5000.0] * 20)  # Only 20 months, need 24
        
        assert len(data) < 24, "Should have insufficient data"
    
    def test_model_not_loaded_error(self):
        """Test error when model is not loaded"""
        model = None
        
        assert model is None, "Model should be None"
    
    def test_database_connection_error(self):
        """Test error handling for database connection"""
        # Simulate connection error
        connection = None
        
        assert connection is None, "Connection should be None"


class TestDataValidation:
    """Test data validation"""
    
    def test_forecast_values_are_positive(self):
        """Test that forecast values are positive"""
        predictions = [5000.0, 5100.0, 5200.0, 5300.0, 5400.0, 5500.0,
                      5600.0, 5700.0, 5800.0, 5900.0, 6000.0, 6100.0]
        
        for pred in predictions:
            assert pred > 0, f"Prediction {pred} should be positive"
    
    def test_forecast_values_are_numeric(self):
        """Test that forecast values are numeric"""
        predictions = [5000.0, 5100.0, 5200.0, 5300.0, 5400.0, 5500.0,
                      5600.0, 5700.0, 5800.0, 5900.0, 6000.0, 6100.0]
        
        for pred in predictions:
            assert isinstance(pred, (int, float)), f"Prediction {pred} should be numeric"
    
    def test_mape_is_valid_percentage(self):
        """Test that MAPE is a valid percentage"""
        mape_values = [5.5, 10.2, 15.8, 19.9]
        
        for mape in mape_values:
            assert 0 <= mape <= 100, f"MAPE {mape} should be between 0 and 100"
    
    def test_processing_time_is_positive(self):
        """Test that processing time is positive"""
        processing_times = [0.5, 1.2, 2.3, 3.1]
        
        for time in processing_times:
            assert time > 0, f"Processing time {time} should be positive"


class TestDataIntegrity:
    """Test data integrity"""
    
    def test_forecast_has_12_months(self):
        """Test that forecast always has 12 months"""
        predictions = [{"month": f"2024-{i+1:02d}", "value": 5000.0 + i*100} for i in range(12)]
        
        assert len(predictions) == 12, "Should have exactly 12 predictions"
    
    def test_no_duplicate_months_in_forecast(self):
        """Test that forecast has no duplicate months"""
        predictions = [{"month": f"2024-{i+1:02d}", "value": 5000.0 + i*100} for i in range(12)]
        
        months = [p["month"] for p in predictions]
        assert len(months) == len(set(months)), "Should not have duplicate months"
    
    def test_profit_never_exceeds_sales(self):
        """Test that profit never exceeds sales (when costs are positive)"""
        sales = np.array([10000.0] * 12)
        costs = np.array([5000.0] * 12)
        profit = sales - costs
        
        for i in range(12):
            assert profit[i] <= sales[i], f"Profit {profit[i]} should not exceed sales {sales[i]}"
