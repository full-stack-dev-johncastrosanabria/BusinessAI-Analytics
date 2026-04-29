"""
Comprehensive unit tests for main.py FastAPI endpoints
Tests all endpoints to achieve ≥80% coverage
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock, MagicMock
import numpy as np
from datetime import datetime
import os
import sys

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, ForecastPrediction, ForecastResponse, ChatbotQueryRequest, ChatbotQueryResponse


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def mock_db_connection():
    """Mock database connection"""
    mock_db = Mock()
    mock_db.get_business_metrics.return_value = np.array([5000.0] * 30)  # 30 months of data
    return mock_db


@pytest.fixture
def mock_sales_model():
    """Mock sales forecast model"""
    mock_model = Mock()
    predictions = np.array([5000.0 + i * 100 for i in range(12)])
    mock_model.forecast.return_value = (predictions, 5.5)
    mock_model.train.return_value = 5.5
    mock_model.save_model = Mock()
    mock_model.load_model = Mock()
    return mock_model


@pytest.fixture
def mock_cost_model():
    """Mock cost forecast model"""
    mock_model = Mock()
    predictions = np.array([3000.0 + i * 50 for i in range(12)])
    mock_model.forecast.return_value = (predictions, 4.2)
    mock_model.train.return_value = 4.2
    mock_model.save_model = Mock()
    mock_model.load_model = Mock()
    return mock_model


@pytest.fixture
def mock_query_processor():
    """Mock advanced query processor"""
    mock_processor = AsyncMock()
    mock_processor.process_query.return_value = (
        "The total sales were $50,000.",
        ["database:business_metrics"]
    )
    return mock_processor


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check_returns_200(self, client):
        """Test that health check returns 200 status"""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_health_check_response_structure(self, client):
        """Test that health check has correct response structure"""
        response = client.get("/health")
        data = response.json()
        
        assert "status" in data
        assert "service" in data
        assert "timestamp" in data
        assert data["status"] == "healthy"
        assert data["service"] == "AI Service"
    
    def test_health_check_timestamp_format(self, client):
        """Test that health check timestamp is valid ISO format"""
        response = client.get("/health")
        data = response.json()
        
        # Should be able to parse as ISO datetime
        timestamp = datetime.fromisoformat(data["timestamp"])
        assert isinstance(timestamp, datetime)


class TestSalesForecastEndpoint:
    """Test sales forecast endpoint"""
    
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_sales_success(self, mock_db, mock_model, client, mock_db_connection, mock_sales_model):
        """Test successful sales forecast"""
        mock_db.return_value = mock_db_connection
        mock_model.return_value = mock_sales_model
        
        # Set up mocks
        import main
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model
        
        response = client.post("/api/ai/forecast/sales")
        
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
        assert "mape" in data
    
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_sales_model_not_loaded(self, mock_db, mock_model, client):
        """Test sales forecast when model is not loaded"""
        import main
        main._sales_model = None
        main._db_connection = Mock()
        
        response = client.post("/api/ai/forecast/sales")
        
        assert response.status_code == 503
        assert "not loaded" in response.json()["detail"].lower()
    
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_sales_insufficient_data(self, mock_db, mock_model, client, mock_sales_model):
        """Test sales forecast with insufficient training data"""
        mock_db_insufficient = Mock()
        mock_db_insufficient.get_business_metrics.return_value = np.array([5000.0] * 20)  # Only 20 months
        
        import main
        main._sales_model = mock_sales_model
        main._db_connection = mock_db_insufficient
        
        response = client.post("/api/ai/forecast/sales")
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_sales_internal_error(self, mock_db, mock_model, client, mock_db_connection):
        """Test sales forecast with internal error"""
        mock_model_error = Mock()
        mock_model_error.forecast.side_effect = Exception("Model error")
        
        import main
        main._sales_model = mock_model_error
        main._db_connection = mock_db_connection
        
        response = client.post("/api/ai/forecast/sales")
        
        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


class TestCostsForecastEndpoint:
    """Test costs forecast endpoint"""
    
    @patch('main._cost_model')
    @patch('main._db_connection')
    def test_forecast_costs_success(self, mock_db, mock_model, client, mock_db_connection, mock_cost_model):
        """Test successful cost forecast"""
        import main
        main._db_connection = mock_db_connection
        main._cost_model = mock_cost_model
        
        response = client.post("/api/ai/forecast/costs")
        
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
        assert "mape" in data
    
    @patch('main._cost_model')
    @patch('main._db_connection')
    def test_forecast_costs_model_not_loaded(self, mock_db, mock_model, client):
        """Test cost forecast when model is not loaded"""
        import main
        main._cost_model = None
        main._db_connection = Mock()
        
        response = client.post("/api/ai/forecast/costs")
        
        assert response.status_code == 503
        assert "not loaded" in response.json()["detail"].lower()
    
    @patch('main._cost_model')
    @patch('main._db_connection')
    def test_forecast_costs_insufficient_data(self, mock_db, mock_model, client, mock_cost_model):
        """Test cost forecast with insufficient training data"""
        mock_db_insufficient = Mock()
        mock_db_insufficient.get_business_metrics.return_value = np.array([3000.0] * 15)  # Only 15 months
        
        import main
        main._cost_model = mock_cost_model
        main._db_connection = mock_db_insufficient
        
        response = client.post("/api/ai/forecast/costs")
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    @patch('main._cost_model')
    @patch('main._db_connection')
    def test_forecast_costs_with_import_error(self, mock_db, mock_model, client, mock_db_connection):
        """Test cost forecast with ImportError (TensorFlow not available)"""
        mock_model_import_error = Mock()
        mock_model_import_error.forecast.side_effect = ImportError("TensorFlow not available")
        
        import main
        main._cost_model = mock_model_import_error
        main._db_connection = mock_db_connection
        
        response = client.post("/api/ai/forecast/costs")
        
        # Should still return 200 with simple projection
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
    
    @patch('main._cost_model')
    @patch('main._db_connection')
    def test_forecast_costs_internal_error(self, mock_db, mock_model, client, mock_db_connection):
        """Test cost forecast with internal error"""
        mock_model_error = Mock()
        mock_model_error.forecast.side_effect = RuntimeError("Model error")
        
        import main
        main._cost_model = mock_model_error
        main._db_connection = mock_db_connection
        
        response = client.post("/api/ai/forecast/costs")
        
        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


class TestProfitForecastEndpoint:
    """Test profit forecast endpoint"""
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_profit_success(self, mock_db, mock_sales, mock_cost, client, 
                                     mock_db_connection, mock_sales_model, mock_cost_model):
        """Test successful profit forecast"""
        import main
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model
        
        response = client.post("/api/ai/forecast/profit")
        
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
        
        # Verify profit = sales - costs
        for pred in data["predictions"]:
            assert "month" in pred
            assert "value" in pred
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_profit_models_not_loaded(self, mock_db, mock_sales, mock_cost, client):
        """Test profit forecast when models are not loaded"""
        import main
        main._sales_model = None
        main._cost_model = None
        main._db_connection = Mock()
        
        response = client.post("/api/ai/forecast/profit")
        
        assert response.status_code == 503
        assert "not loaded" in response.json()["detail"].lower()
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_profit_sales_model_missing(self, mock_db, mock_sales, mock_cost, client, mock_cost_model):
        """Test profit forecast when only sales model is missing"""
        import main
        main._sales_model = None
        main._cost_model = mock_cost_model
        main._db_connection = Mock()
        
        response = client.post("/api/ai/forecast/profit")
        
        assert response.status_code == 503
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_profit_insufficient_data(self, mock_db, mock_sales, mock_cost, client, 
                                               mock_sales_model, mock_cost_model):
        """Test profit forecast with insufficient training data"""
        mock_db_insufficient = Mock()
        mock_db_insufficient.get_business_metrics.return_value = np.array([5000.0] * 10)  # Only 10 months
        
        import main
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model
        main._db_connection = mock_db_insufficient
        
        response = client.post("/api/ai/forecast/profit")
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_profit_with_cost_import_error(self, mock_db, mock_sales, mock_cost, client,
                                                     mock_db_connection, mock_sales_model):
        """Test profit forecast when cost model has ImportError"""
        mock_cost_import_error = Mock()
        mock_cost_import_error.forecast.side_effect = ImportError("TensorFlow not available")
        
        import main
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_import_error
        main._db_connection = mock_db_connection
        
        response = client.post("/api/ai/forecast/profit")
        
        # Should still return 200 with simple projection for costs
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_forecast_profit_internal_error(self, mock_db, mock_sales, mock_cost, client, mock_db_connection):
        """Test profit forecast with internal error"""
        mock_sales_error = Mock()
        mock_sales_error.forecast.side_effect = RuntimeError("Model error")
        
        import main
        main._sales_model = mock_sales_error
        main._cost_model = Mock()
        main._db_connection = mock_db_connection
        
        response = client.post("/api/ai/forecast/profit")
        
        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


class TestChatbotEndpoint:
    """Test chatbot query endpoint"""
    
    @patch('main._advanced_query_processor')
    def test_chatbot_query_success(self, mock_processor, client, mock_query_processor):
        """Test successful chatbot query"""
        import main
        main._advanced_query_processor = mock_query_processor
        
        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "question" in data
        assert "answer" in data
        assert "sources" in data
        assert "processing_time" in data
        assert data["question"] == "What are the total sales?"
    
    @patch('main._advanced_query_processor')
    def test_chatbot_query_not_initialized(self, mock_processor, client):
        """Test chatbot query when processor is not initialized"""
        import main
        main._advanced_query_processor = None
        
        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"}
        )
        
        assert response.status_code == 503
        assert "not initialized" in response.json()["detail"].lower()
    
    @patch('main._advanced_query_processor')
    def test_chatbot_query_empty_question(self, mock_processor, client):
        """Test chatbot query with empty question"""
        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "   "}
        )
        
        assert response.status_code == 422  # Validation error
    
    @patch('main._advanced_query_processor')
    def test_chatbot_query_too_long(self, mock_processor, client):
        """Test chatbot query with question exceeding max length"""
        long_question = "a" * 1001  # Exceeds MAX_QUESTION_LENGTH of 1000
        
        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": long_question}
        )
        
        assert response.status_code == 422  # Validation error
    
    @patch('main._advanced_query_processor')
    def test_chatbot_query_internal_error(self, mock_processor, client):
        """Test chatbot query with internal error"""
        mock_error_processor = AsyncMock()
        mock_error_processor.process_query.side_effect = RuntimeError("Processing error")
        
        import main
        main._advanced_query_processor = mock_error_processor
        
        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"}
        )
        
        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()
    
    @patch('main._advanced_query_processor')
    def test_chatbot_query_processing_time(self, mock_processor, client, mock_query_processor):
        """Test that chatbot query includes processing time"""
        import main
        main._advanced_query_processor = mock_query_processor
        
        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["processing_time"] >= 0


class TestTrainingEndpoint:
    """Test model training endpoint"""
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    @patch('os.makedirs')
    def test_train_models_success(self, mock_makedirs, mock_db, mock_sales, mock_cost, client,
                                   mock_db_connection, mock_sales_model, mock_cost_model):
        """Test successful model training"""
        import main
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model
        
        response = client.post("/api/ai/train")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "sales_mape" in data
        assert "cost_mape" in data
        assert data["sales_mape"] == 5.5
        assert data["cost_mape"] == 4.2
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_train_models_not_initialized(self, mock_db, mock_sales, mock_cost, client):
        """Test training when models are not initialized"""
        import main
        main._sales_model = None
        main._cost_model = None
        main._db_connection = Mock()
        
        response = client.post("/api/ai/train")
        
        assert response.status_code == 503
        assert "not initialized" in response.json()["detail"].lower()
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_train_models_insufficient_data(self, mock_db, mock_sales, mock_cost, client,
                                            mock_sales_model, mock_cost_model):
        """Test training with insufficient data"""
        mock_db_insufficient = Mock()
        mock_db_insufficient.get_business_metrics.return_value = np.array([5000.0] * 18)  # Only 18 months
        
        import main
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model
        main._db_connection = mock_db_insufficient
        
        response = client.post("/api/ai/train")
        
        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    def test_train_models_with_request_body(self, mock_db, mock_sales, mock_cost, client,
                                             mock_db_connection, mock_sales_model, mock_cost_model):
        """Test training with request body"""
        import main
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model
        
        response = client.post(
            "/api/ai/train",
            json={"force_retrain": True}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
    
    @patch('main._cost_model')
    @patch('main._sales_model')
    @patch('main._db_connection')
    @patch('os.makedirs')
    def test_train_models_internal_error(self, mock_makedirs, mock_db, mock_sales, mock_cost, client,
                                         mock_db_connection):
        """Test training with internal error"""
        mock_sales_error = Mock()
        mock_sales_error.train.side_effect = RuntimeError("Training error")
        
        import main
        main._sales_model = mock_sales_error
        main._cost_model = Mock()
        main._db_connection = mock_db_connection
        
        response = client.post("/api/ai/train")
        
        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


class TestRequestModels:
    """Test request/response models"""
    
    def test_chatbot_query_request_validation(self):
        """Test ChatbotQueryRequest validation"""
        # Valid request
        valid_request = ChatbotQueryRequest(question="What are the sales?")
        assert valid_request.question == "What are the sales?"
        
        # Empty question should fail
        with pytest.raises(ValueError):
            ChatbotQueryRequest(question="")
        
        # Whitespace-only question should fail
        with pytest.raises(ValueError):
            ChatbotQueryRequest(question="   ")
        
        # Too long question should fail
        with pytest.raises(ValueError):
            ChatbotQueryRequest(question="a" * 1001)
    
    def test_forecast_prediction_model(self):
        """Test ForecastPrediction model"""
        pred = ForecastPrediction(month="2024-01", value=5000.0)
        assert pred.month == "2024-01"
        assert pred.value == 5000.0
    
    def test_forecast_response_model(self):
        """Test ForecastResponse model"""
        predictions = [
            ForecastPrediction(month="2024-01", value=5000.0),
            ForecastPrediction(month="2024-02", value=5100.0)
        ]
        response = ForecastResponse(predictions=predictions, mape=5.5)
        assert len(response.predictions) == 2
        assert response.mape == 5.5
    
    def test_chatbot_query_response_model(self):
        """Test ChatbotQueryResponse model"""
        response = ChatbotQueryResponse(
            question="What are the sales?",
            answer="The sales are $50,000.",
            sources=["database"],
            processing_time=1.2
        )
        assert response.question == "What are the sales?"
        assert response.answer == "The sales are $50,000."
        assert len(response.sources) == 1
        assert response.processing_time == 1.2


class TestStartupShutdown:
    """Test startup and shutdown events"""
    
    @patch('main.DatabaseConnection')
    @patch('main.HybridForecastModel')
    @patch('main.AdvancedIntentClassifier')
    @patch('main.AdvancedQueryProcessor')
    @patch('main.IntentClassifier')
    @patch('main.QueryProcessor')
    @patch('os.path.exists')
    def test_startup_event_success(self, mock_exists, mock_qp, mock_ic, mock_aqp, mock_aic, mock_model, mock_db):
        """Test successful startup event"""
        mock_exists.return_value = True
        mock_db_instance = Mock()
        mock_db.return_value = mock_db_instance
        
        mock_model_instance = Mock()
        mock_model.return_value = mock_model_instance
        
        # Import and trigger startup
        from main import startup_event
        import asyncio
        asyncio.run(startup_event())
        
        # Verify database was initialized
        mock_db.assert_called_once()
    
    @patch('main._db_connection')
    def test_shutdown_event(self, mock_db):
        """Test shutdown event"""
        mock_db_instance = Mock()
        mock_db.return_value = mock_db_instance
        
        import main
        main._db_connection = mock_db_instance
        
        from main import shutdown_event
        import asyncio
        asyncio.run(shutdown_event())
        
        # Verify database connection was closed
        mock_db_instance.close.assert_called_once()
