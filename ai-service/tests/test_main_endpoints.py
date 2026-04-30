"""
Comprehensive unit tests for main.py FastAPI endpoints.
Tests all endpoints to achieve >= 80% coverage.
"""

import asyncio
import os
import sys
from datetime import datetime
from unittest.mock import AsyncMock, Mock, patch

import numpy as np
import pytest
from fastapi.testclient import TestClient

# Add parent directory to path to import main
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main  # noqa: E402  (must come after sys.path manipulation)
from main import (  # noqa: E402
    ChatbotQueryRequest,
    ChatbotQueryResponse,
    ForecastPrediction,
    ForecastResponse,
    app,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_db_connection():
    """Mock database connection returning 30 months of data."""
    mock_db = Mock()
    mock_db.get_business_metrics.return_value = np.array(
        [5000.0] * 30
    )
    return mock_db


@pytest.fixture
def mock_sales_model():
    """Mock sales forecast model."""
    mock_model = Mock()
    predictions = np.array([5000.0 + i * 100 for i in range(12)])
    mock_model.forecast.return_value = (predictions, 5.5)
    mock_model.train.return_value = 5.5
    mock_model.save_model = Mock()
    mock_model.load_model = Mock()
    return mock_model


@pytest.fixture
def mock_cost_model():
    """Mock cost forecast model."""
    mock_model = Mock()
    predictions = np.array([3000.0 + i * 50 for i in range(12)])
    mock_model.forecast.return_value = (predictions, 4.2)
    mock_model.train.return_value = 4.2
    mock_model.save_model = Mock()
    mock_model.load_model = Mock()
    return mock_model


@pytest.fixture
def mock_query_processor():
    """Mock advanced query processor."""
    mock_processor = AsyncMock()
    mock_processor.process_query.return_value = (
        "The total sales were $50,000.",
        ["database:business_metrics"],
    )
    return mock_processor


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_check_returns_200(self, client):
        """Health check should return HTTP 200."""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_check_response_structure(self, client):
        """Health check response must contain required fields."""
        response = client.get("/health")
        data = response.json()

        assert "status" in data
        assert "service" in data
        assert "timestamp" in data
        assert data["status"] == "healthy"
        assert data["service"] == "AI Service"

    def test_health_check_timestamp_format(self, client):
        """Health check timestamp must be a valid ISO datetime."""
        response = client.get("/health")
        data = response.json()

        timestamp = datetime.fromisoformat(data["timestamp"])
        assert isinstance(timestamp, datetime)


# ---------------------------------------------------------------------------
# Sales forecast endpoint
# ---------------------------------------------------------------------------

class TestSalesForecastEndpoint:
    """Tests for POST /api/ai/forecast/sales."""

    def test_forecast_sales_success(
        self, client, mock_db_connection, mock_sales_model
    ):
        """Successful sales forecast returns 200 with 12 predictions."""
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model

        response = client.post("/api/ai/forecast/sales")

        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
        assert "mape" in data

    def test_forecast_sales_model_not_loaded(self, client):
        """Returns 503 when sales model is not loaded."""
        main._sales_model = None
        main._db_connection = Mock()

        response = client.post("/api/ai/forecast/sales")

        assert response.status_code == 503
        assert "not loaded" in response.json()["detail"].lower()

    def test_forecast_sales_insufficient_data(
        self, client, mock_sales_model
    ):
        """Returns 400 when fewer than 24 months of data are available."""
        mock_db = Mock()
        mock_db.get_business_metrics.return_value = np.array(
            [5000.0] * 20
        )
        main._sales_model = mock_sales_model
        main._db_connection = mock_db

        response = client.post("/api/ai/forecast/sales")

        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()

    def test_forecast_sales_internal_error(
        self, client, mock_db_connection
    ):
        """Returns 500 when the model raises an unexpected error."""
        mock_model = Mock()
        mock_model.forecast.side_effect = Exception("Model error")
        main._sales_model = mock_model
        main._db_connection = mock_db_connection

        response = client.post("/api/ai/forecast/sales")

        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Costs forecast endpoint
# ---------------------------------------------------------------------------

class TestCostsForecastEndpoint:
    """Tests for POST /api/ai/forecast/costs."""

    def test_forecast_costs_success(
        self, client, mock_db_connection, mock_cost_model
    ):
        """Successful cost forecast returns 200 with 12 predictions."""
        main._db_connection = mock_db_connection
        main._cost_model = mock_cost_model

        response = client.post("/api/ai/forecast/costs")

        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
        assert "mape" in data

    def test_forecast_costs_model_not_loaded(self, client):
        """Returns 503 when cost model is not loaded."""
        main._cost_model = None
        main._db_connection = Mock()

        response = client.post("/api/ai/forecast/costs")

        assert response.status_code == 503
        assert "not loaded" in response.json()["detail"].lower()

    def test_forecast_costs_insufficient_data(
        self, client, mock_cost_model
    ):
        """Returns 400 when fewer than 24 months of data are available."""
        mock_db = Mock()
        mock_db.get_business_metrics.return_value = np.array(
            [3000.0] * 15
        )
        main._cost_model = mock_cost_model
        main._db_connection = mock_db

        response = client.post("/api/ai/forecast/costs")

        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()

    def test_forecast_costs_with_import_error(
        self, client, mock_db_connection
    ):
        """Falls back to simple projection when TensorFlow is unavailable."""
        mock_model = Mock()
        mock_model.forecast.side_effect = ImportError(
            "TensorFlow not available"
        )
        main._cost_model = mock_model
        main._db_connection = mock_db_connection

        response = client.post("/api/ai/forecast/costs")

        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12

    def test_forecast_costs_internal_error(
        self, client, mock_db_connection
    ):
        """Returns 500 when the model raises an unexpected error."""
        mock_model = Mock()
        mock_model.forecast.side_effect = RuntimeError("Model error")
        main._cost_model = mock_model
        main._db_connection = mock_db_connection

        response = client.post("/api/ai/forecast/costs")

        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Profit forecast endpoint
# ---------------------------------------------------------------------------

class TestProfitForecastEndpoint:
    """Tests for POST /api/ai/forecast/profit."""

    def test_forecast_profit_success(
        self,
        client,
        mock_db_connection,
        mock_sales_model,
        mock_cost_model,
    ):
        """Successful profit forecast returns 200 with 12 predictions."""
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model

        response = client.post("/api/ai/forecast/profit")

        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12
        for pred in data["predictions"]:
            assert "month" in pred
            assert "value" in pred

    def test_forecast_profit_models_not_loaded(self, client):
        """Returns 503 when both models are not loaded."""
        main._sales_model = None
        main._cost_model = None
        main._db_connection = Mock()

        response = client.post("/api/ai/forecast/profit")

        assert response.status_code == 503
        assert "not loaded" in response.json()["detail"].lower()

    def test_forecast_profit_sales_model_missing(
        self, client, mock_cost_model
    ):
        """Returns 503 when only the sales model is missing."""
        main._sales_model = None
        main._cost_model = mock_cost_model
        main._db_connection = Mock()

        response = client.post("/api/ai/forecast/profit")

        assert response.status_code == 503

    def test_forecast_profit_insufficient_data(
        self, client, mock_sales_model, mock_cost_model
    ):
        """Returns 400 when fewer than 24 months of data are available."""
        mock_db = Mock()
        mock_db.get_business_metrics.return_value = np.array(
            [5000.0] * 10
        )
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model
        main._db_connection = mock_db

        response = client.post("/api/ai/forecast/profit")

        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()

    def test_forecast_profit_with_cost_import_error(
        self, client, mock_db_connection, mock_sales_model
    ):
        """Falls back to simple cost projection when TensorFlow is absent."""
        mock_cost = Mock()
        mock_cost.forecast.side_effect = ImportError(
            "TensorFlow not available"
        )
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost
        main._db_connection = mock_db_connection

        response = client.post("/api/ai/forecast/profit")

        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) == 12

    def test_forecast_profit_internal_error(
        self, client, mock_db_connection
    ):
        """Returns 500 when the sales model raises an unexpected error."""
        mock_sales = Mock()
        mock_sales.forecast.side_effect = RuntimeError("Model error")
        main._sales_model = mock_sales
        main._cost_model = Mock()
        main._db_connection = mock_db_connection

        response = client.post("/api/ai/forecast/profit")

        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Chatbot endpoint
# ---------------------------------------------------------------------------

class TestChatbotEndpoint:
    """Tests for POST /api/ai/chatbot/query."""

    def test_chatbot_query_success(
        self, client, mock_query_processor
    ):
        """Successful chatbot query returns 200 with all required fields."""
        main._advanced_query_processor = mock_query_processor

        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "question" in data
        assert "answer" in data
        assert "sources" in data
        assert "processing_time" in data
        assert data["question"] == "What are the total sales?"

    def test_chatbot_query_not_initialized(self, client):
        """Returns 503 when the query processor is not initialized."""
        main._advanced_query_processor = None

        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"},
        )

        assert response.status_code == 503
        assert "not initialized" in response.json()["detail"].lower()

    def test_chatbot_query_empty_question(self, client):
        """Returns 422 for a whitespace-only question."""
        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "   "},
        )

        assert response.status_code == 422

    def test_chatbot_query_too_long(self, client):
        """Returns 422 when the question exceeds MAX_QUESTION_LENGTH."""
        long_question = "a" * 1001

        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": long_question},
        )

        assert response.status_code == 422

    def test_chatbot_query_internal_error(self, client):
        """Returns 500 when the processor raises an unexpected error."""
        mock_processor = AsyncMock()
        mock_processor.process_query.side_effect = RuntimeError(
            "Processing error"
        )
        main._advanced_query_processor = mock_processor

        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"},
        )

        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()

    def test_chatbot_query_processing_time(
        self, client, mock_query_processor
    ):
        """Processing time in the response must be non-negative."""
        main._advanced_query_processor = mock_query_processor

        response = client.post(
            "/api/ai/chatbot/query",
            json={"question": "What are the total sales?"},
        )

        assert response.status_code == 200
        assert response.json()["processing_time"] >= 0


# ---------------------------------------------------------------------------
# Training endpoint
# ---------------------------------------------------------------------------

class TestTrainingEndpoint:
    """Tests for POST /api/ai/train."""

    @patch("os.makedirs")
    def test_train_models_success(
        self,
        _mock_makedirs,
        client,
        mock_db_connection,
        mock_sales_model,
        mock_cost_model,
    ):
        """Successful training returns 200 with status and MAPE values."""
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model

        response = client.post("/api/ai/train")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "sales_mape" in data
        assert "cost_mape" in data
        assert abs(data["sales_mape"] - 5.5) < 1e-9
        assert abs(data["cost_mape"] - 4.2) < 1e-9

    def test_train_models_not_initialized(self, client):
        """Returns 503 when models are not initialized."""
        main._sales_model = None
        main._cost_model = None
        main._db_connection = Mock()

        response = client.post("/api/ai/train")

        assert response.status_code == 503
        assert "not initialized" in response.json()["detail"].lower()

    def test_train_models_insufficient_data(
        self, client, mock_sales_model, mock_cost_model
    ):
        """Returns 400 when fewer than 24 months of data are available."""
        mock_db = Mock()
        mock_db.get_business_metrics.return_value = np.array(
            [5000.0] * 18
        )
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model
        main._db_connection = mock_db

        response = client.post("/api/ai/train")

        assert response.status_code == 400
        assert "insufficient" in response.json()["detail"].lower()

    @patch("os.makedirs")
    def test_train_models_with_request_body(
        self,
        _mock_makedirs,
        client,
        mock_db_connection,
        mock_sales_model,
        mock_cost_model,
    ):
        """Training with force_retrain=True still returns 200."""
        main._db_connection = mock_db_connection
        main._sales_model = mock_sales_model
        main._cost_model = mock_cost_model

        response = client.post(
            "/api/ai/train",
            json={"force_retrain": True},
        )

        assert response.status_code == 200
        assert response.json()["status"] == "success"

    @patch("os.makedirs")
    def test_train_models_internal_error(
        self, _mock_makedirs, client, mock_db_connection
    ):
        """Returns 500 when training raises an unexpected error."""
        mock_sales = Mock()
        mock_sales.train.side_effect = RuntimeError("Training error")
        main._sales_model = mock_sales
        main._cost_model = Mock()
        main._db_connection = mock_db_connection

        response = client.post("/api/ai/train")

        assert response.status_code == 500
        assert "internal server error" in response.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Request / response model validation
# ---------------------------------------------------------------------------

class TestRequestModels:
    """Unit tests for Pydantic request/response models."""

    def test_chatbot_query_request_valid(self):
        """Valid question is accepted and stripped."""
        req = ChatbotQueryRequest(question="What are the sales?")
        assert req.question == "What are the sales?"

    def test_chatbot_query_request_empty_raises(self):
        """Empty question raises ValueError."""
        with pytest.raises(ValueError):
            ChatbotQueryRequest(question="")

    def test_chatbot_query_request_whitespace_raises(self):
        """Whitespace-only question raises ValueError."""
        with pytest.raises(ValueError):
            ChatbotQueryRequest(question="   ")

    def test_chatbot_query_request_too_long_raises(self):
        """Question exceeding 1000 chars raises ValueError."""
        with pytest.raises(ValueError):
            ChatbotQueryRequest(question="a" * 1001)

    def test_forecast_prediction_model(self):
        """ForecastPrediction stores month and value correctly."""
        pred = ForecastPrediction(month="2024-01", value=5000.0)
        assert pred.month == "2024-01"
        assert abs(pred.value - 5000.0) < 1e-9

    def test_forecast_response_model(self):
        """ForecastResponse stores predictions list and mape."""
        predictions = [
            ForecastPrediction(month="2024-01", value=5000.0),
            ForecastPrediction(month="2024-02", value=5100.0),
        ]
        resp = ForecastResponse(predictions=predictions, mape=5.5)
        assert len(resp.predictions) == 2
        assert abs(resp.mape - 5.5) < 1e-9

    def test_chatbot_query_response_model(self):
        """ChatbotQueryResponse stores all fields correctly."""
        resp = ChatbotQueryResponse(
            question="What are the sales?",
            answer="The sales are $50,000.",
            sources=["database"],
            processing_time=1.2,
        )
        assert resp.question == "What are the sales?"
        assert resp.answer == "The sales are $50,000."
        assert len(resp.sources) == 1
        assert abs(resp.processing_time - 1.2) < 1e-9


# ---------------------------------------------------------------------------
# Startup / shutdown lifecycle
# ---------------------------------------------------------------------------

class TestStartupShutdown:
    """Tests for FastAPI startup and shutdown event handlers."""

    @patch("main.DatabaseConnection")
    @patch("main.HybridForecastModel")
    @patch("main.AdvancedIntentClassifier")
    @patch("main.AdvancedQueryProcessor")
    @patch("main.IntentClassifier")
    @patch("main.QueryProcessor")
    @patch("os.path.exists")
    def test_startup_event_success(
        self,
        mock_exists,
        _mock_qp,
        _mock_ic,
        _mock_aqp,
        _mock_aic,
        mock_model,
        mock_db,
    ):
        """Startup initialises the database connection."""
        mock_exists.return_value = True
        mock_db.return_value = Mock()
        mock_model.return_value = Mock()

        from main import startup_event  # noqa: PLC0415

        asyncio.run(startup_event())

        mock_db.assert_called_once()

    def test_shutdown_event(self):
        """Shutdown closes the database connection."""
        mock_db_instance = Mock()
        main._db_connection = mock_db_instance

        from main import shutdown_event  # noqa: PLC0415

        asyncio.run(shutdown_event())

        mock_db_instance.close.assert_called_once()
