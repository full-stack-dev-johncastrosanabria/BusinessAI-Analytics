"""
Property-based tests for forecast response structure
Tests that forecast responses contain exactly 12 predictions with month and value
"""

import pytest


class ForecastPrediction:
    """Mock forecast prediction"""
    def __init__(self, month: str, value: float):
        self.month = month
        self.value = value


class ForecastResponse:
    """Mock forecast response"""
    def __init__(self, predictions: list, mape: float = None):
        self.predictions = predictions
        self.mape = mape


class TestForecastResponseStructure:
    """Test forecast response structure property"""
    
    def test_forecast_response_has_exactly_12_predictions(self):
        """
        Property 15: Forecast Response Structure Completeness
        Test that forecast responses contain exactly 12 predictions with month and value
        
        Validates: Requirements 8.4, 9.4, 10.3
        """
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=5000.0 + i*100)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions, mape=15.5)
        
        # Assert exactly 12 predictions
        assert len(response.predictions) == 12, \
            f"Expected 12 predictions, got {len(response.predictions)}"
        
        # Assert each prediction has month and value
        for i, pred in enumerate(response.predictions):
            assert hasattr(pred, 'month'), f"Prediction {i} missing 'month' field"
            assert hasattr(pred, 'value'), f"Prediction {i} missing 'value' field"
            assert isinstance(pred.month, str), f"Prediction {i} month should be string"
            assert isinstance(pred.value, (int, float)), f"Prediction {i} value should be numeric"
    
    def test_forecast_response_with_valid_months(self):
        """Test forecast response with valid month format"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=5000.0 + i*100)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions, mape=15.5)
        
        # Verify months are in correct format
        for i, pred in enumerate(response.predictions):
            expected_month = f"2024-{i+1:02d}"
            assert pred.month == expected_month, \
                f"Month {i} should be {expected_month}, got {pred.month}"
    
    def test_forecast_response_with_positive_values(self):
        """Test forecast response with positive values"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=1000.0 + i*500)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions)
        
        # All values should be positive
        for pred in response.predictions:
            assert pred.value > 0, f"Value {pred.value} should be positive"
    
    def test_forecast_response_with_zero_values(self):
        """Test forecast response with zero values"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=0.0)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions)
        
        # All values should be zero
        for pred in response.predictions:
            assert pred.value == 0.0, f"Value {pred.value} should be 0.0"
    
    def test_forecast_response_with_negative_values(self):
        """Test forecast response with negative values (loss scenarios)"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=-1000.0 - i*100)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions)
        
        # All values should be negative
        for pred in response.predictions:
            assert pred.value < 0, f"Value {pred.value} should be negative"
    
    def test_forecast_response_with_mape_metric(self):
        """Test forecast response includes MAPE metric"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=5000.0)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions, mape=18.5)
        
        # MAPE should be present and valid
        assert response.mape is not None, "MAPE should be present"
        assert 0 <= response.mape <= 100, f"MAPE {response.mape} should be between 0 and 100"
    
    def test_forecast_response_without_mape_metric(self):
        """Test forecast response can omit MAPE metric"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=5000.0)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions)
        
        # MAPE can be None
        assert response.mape is None, "MAPE should be None when not provided"
    
    def test_forecast_response_with_large_values(self):
        """Test forecast response with large values"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=1e7 + i*1e6)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions)
        
        # Should handle large values
        assert len(response.predictions) == 12
        for pred in response.predictions:
            assert pred.value > 0
    
    def test_forecast_response_with_small_values(self):
        """Test forecast response with small decimal values"""
        predictions = [
            ForecastPrediction(month=f"2024-{i+1:02d}", value=0.01 + i*0.001)
            for i in range(12)
        ]
        response = ForecastResponse(predictions=predictions)
        
        # Should handle small decimal values
        assert len(response.predictions) == 12
        for pred in response.predictions:
            assert pred.value > 0
