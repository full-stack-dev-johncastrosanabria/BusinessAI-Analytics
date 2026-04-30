"""
FastAPI AI Service for BusinessAI-Analytics Platform
Provides forecasting and chatbot capabilities
"""

import logging
import os
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator

from database import DatabaseConnection
from models.hybrid_forecast import HybridForecastModel
from chatbot.intent_classifier import (
    AdvancedIntentClassifier,
    IntentClassifier,
)
from chatbot.query_processor import QueryProcessor
from chatbot.advanced_query_processor import AdvancedQueryProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
INSUFFICIENT_TRAINING_DATA = (
    "Insufficient training data. "
    "Need at least 24 months of historical data."
)
INTERNAL_SERVER_ERROR = "Internal server error."
MIN_TRAINING_MONTHS = 24
FORECAST_MONTHS = 12
GROWTH_RATE = 1.02
MAX_QUESTION_LENGTH = 1000

# Initialize FastAPI app
app = FastAPI(
    title="BusinessAI Analytics AI Service",
    description="AI Service for forecasting and chatbot capabilities",
    version="1.0.0"
)

# Note: CORS is handled by API Gateway, not needed here

# Module-level state (initialized on startup)
_db_connection = None
_sales_model = None
_cost_model = None
_intent_classifier = None
_query_processor = None
_advanced_classifier = None
_advanced_query_processor = None


# Request/Response Models

class ForecastPrediction(BaseModel):
    """A single monthly forecast prediction."""

    month: str
    value: float


class ForecastResponse(BaseModel):
    """Response containing a list of forecast predictions."""

    predictions: List[ForecastPrediction]
    mape: Optional[float] = None


class ChatbotQueryRequest(BaseModel):
    """Request model for chatbot queries."""

    question: str

    @field_validator("question")
    @classmethod
    def validate_question(cls, v: str) -> str:
        """Validate question is non-empty and within length limits."""
        v = v.strip()
        if not v:
            raise ValueError("Question must not be empty.")
        if len(v) > MAX_QUESTION_LENGTH:
            raise ValueError(
                f"Question must not exceed {MAX_QUESTION_LENGTH} characters."
            )
        return v


class ChatbotQueryResponse(BaseModel):
    """Response model for chatbot queries."""

    question: str
    answer: str
    sources: List[str] = []
    processing_time: float = 0.0


class TrainingRequest(BaseModel):
    """Request model for model training."""

    force_retrain: bool = False


class TrainingResponse(BaseModel):
    """Response model for model training results."""

    status: str
    message: str
    sales_mape: Optional[float] = None
    cost_mape: Optional[float] = None


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize database connection and load models on startup."""
    global _db_connection, _sales_model, _cost_model
    global _intent_classifier, _query_processor
    global _advanced_classifier, _advanced_query_processor

    try:
        logger.info("Initializing AI Service...")

        # Initialize database connection
        _db_connection = DatabaseConnection()
        logger.info("Database connection initialized")

        # Load or initialize models
        _sales_model = HybridForecastModel(sequence_length=FORECAST_MONTHS)
        _cost_model = HybridForecastModel(sequence_length=FORECAST_MONTHS)

        # Try to load pre-trained models
        sales_model_path = "trained_models/sales_forecast_model.pt"
        cost_model_path = "trained_models/cost_forecast_model.pt"

        if os.path.exists(sales_model_path):
            _sales_model.load_model(sales_model_path)
            logger.info("Sales model loaded from disk")
        else:
            logger.warning("Sales model not found, will need training")

        if os.path.exists(cost_model_path):
            _cost_model.load_model(cost_model_path)
            logger.info("Cost model loaded from disk")
        else:
            logger.warning("Cost model not found, will need training")

        # Initialize chatbot components (both standard and advanced)
        _intent_classifier = IntentClassifier()
        _query_processor = QueryProcessor(_db_connection)

        # Initialize advanced multilingual components
        _advanced_classifier = AdvancedIntentClassifier()
        _advanced_query_processor = AdvancedQueryProcessor(_db_connection)

        logger.info(
            "Chatbot components initialized (standard + advanced multilingual)"
        )
        logger.info("AI Service startup complete")
    except Exception as e:
        logger.error("Error during startup: %s", e, exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event() -> None:
    """Clean up resources on shutdown."""
    if _db_connection:
        _db_connection.close()
        logger.info("Database connection closed")


# Forecast Endpoints

@app.post(
    "/api/ai/forecast/sales",
    responses={
        400: {"description": "Insufficient training data"},
        500: {"description": "Internal server error"},
        503: {"description": "Sales model not loaded"},
    },
)
async def forecast_sales() -> ForecastResponse:
    """
    Generate 12-month sales forecast.

    Returns:
        ForecastResponse: 12 monthly sales predictions with MAPE metric
    """
    try:
        if _sales_model is None:
            raise HTTPException(
                status_code=503,
                detail="Sales model not loaded. Please train the model first.",
            )

        historical_data = _db_connection.get_business_metrics()
        if len(historical_data) < MIN_TRAINING_MONTHS:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA,
            )

        predictions, mape = _sales_model.forecast(historical_data)

        forecast_data = [
            ForecastPrediction(
                month=f"2024-{(i % FORECAST_MONTHS) + 1:02d}",
                value=float(v),
            )
            for i, v in enumerate(predictions)
        ]

        logger.info("Sales forecast generated with MAPE: %s", mape)
        return ForecastResponse(predictions=forecast_data, mape=mape)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error generating sales forecast: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Internal server error."
        ) from e


@app.post(
    "/api/ai/forecast/costs",
    responses={
        400: {"description": "Insufficient training data"},
        500: {"description": "Internal server error"},
        503: {"description": "Cost model not loaded"},
    },
)
async def forecast_costs() -> ForecastResponse:
    """
    Generate 12-month cost forecast.

    Returns:
        ForecastResponse: 12 monthly cost predictions with MAPE metric
    """
    try:
        if _cost_model is None:
            raise HTTPException(
                status_code=503,
                detail="Cost model not loaded. Please train the model first.",
            )

        historical_data = _db_connection.get_business_metrics()
        if len(historical_data) < MIN_TRAINING_MONTHS:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA,
            )

        try:
            predictions, mape = _cost_model.forecast(historical_data)
        except ImportError as ie:
            logger.warning(
                "TensorFlow not available, using simple projection: %s", ie
            )
            avg_cost = sum(historical_data) / len(historical_data)
            predictions = [
                avg_cost * GROWTH_RATE ** i for i in range(FORECAST_MONTHS)
            ]
            mape = None

        forecast_data = [
            ForecastPrediction(
                month=f"2024-{(i % FORECAST_MONTHS) + 1:02d}",
                value=float(v),
            )
            for i, v in enumerate(predictions)
        ]

        logger.info("Cost forecast generated with MAPE: %s", mape)
        return ForecastResponse(predictions=forecast_data, mape=mape)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error generating cost forecast: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Internal server error."
        ) from e


@app.post(
    "/api/ai/forecast/profit",
    responses={
        400: {"description": "Insufficient training data"},
        500: {"description": "Internal server error"},
        503: {"description": "Models not loaded"},
    },
)
async def forecast_profit() -> ForecastResponse:
    """
    Generate 12-month profit forecast by subtracting cost from sales.

    Returns:
        ForecastResponse: 12 monthly profit predictions
    """
    try:
        if _sales_model is None or _cost_model is None:
            raise HTTPException(
                status_code=503,
                detail="Models not loaded. Please train the models first.",
            )

        historical_data = _db_connection.get_business_metrics()
        if len(historical_data) < MIN_TRAINING_MONTHS:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA,
            )

        sales_predictions, _ = _sales_model.forecast(historical_data)

        try:
            cost_predictions, _ = _cost_model.forecast(historical_data)
        except ImportError as ie:
            logger.warning(
                "TensorFlow not available for cost forecast, "
                "using simple projection: %s",
                ie,
            )
            avg_cost = sum(historical_data) / len(historical_data)
            cost_predictions = [
                avg_cost * GROWTH_RATE ** i for i in range(FORECAST_MONTHS)
            ]

        profit_predictions = sales_predictions - cost_predictions

        forecast_data = [
            ForecastPrediction(
                month=f"2024-{(i % FORECAST_MONTHS) + 1:02d}",
                value=float(v),
            )
            for i, v in enumerate(profit_predictions)
        ]

        logger.info("Profit forecast generated")
        return ForecastResponse(predictions=forecast_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error generating profit forecast: %s", e, exc_info=True
        )
        raise HTTPException(
            status_code=500, detail="Internal server error."
        ) from e


# Chatbot Endpoints

@app.post(
    "/api/ai/chatbot/query",
    responses={
        500: {"description": "Internal server error"},
        503: {"description": "Chatbot not initialized"},
    },
)
async def process_chatbot_query(
    request: ChatbotQueryRequest,
) -> ChatbotQueryResponse:
    """
    Process a natural language question and return an answer.

    Supports both English and Spanish with automatic language detection.

    Args:
        request: ChatbotQueryRequest with the question

    Returns:
        ChatbotQueryResponse: Answer with sources and processing time
    """
    try:
        start_time = datetime.now()

        if _advanced_query_processor is None:
            raise HTTPException(
                status_code=503,
                detail="Chatbot not initialized",
            )

        answer, sources = await _advanced_query_processor.process_query(
            request.question
        )

        processing_time = (datetime.now() - start_time).total_seconds()

        logger.info(
            "Chatbot query processed in %.2fs", processing_time
        )
        return ChatbotQueryResponse(
            question=request.question,
            answer=answer,
            sources=sources,
            processing_time=processing_time,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "Error processing chatbot query: %s", e, exc_info=True
        )
        raise HTTPException(
            status_code=500, detail="Internal server error."
        ) from e


# Training Endpoint

@app.post(
    "/api/ai/train",
    responses={
        400: {"description": "Insufficient training data"},
        500: {"description": "Internal server error"},
        503: {"description": "Models not initialized"},
    },
)
async def train_models(
    request: TrainingRequest = None,  # noqa: ARG001
) -> TrainingResponse:
    """
    Train both sales and cost forecasting models.

    Args:
        request: TrainingRequest with optional force_retrain flag

    Returns:
        TrainingResponse: Training status and MAPE metrics
    """
    try:
        logger.info("Starting model training...")

        if _sales_model is None or _cost_model is None:
            raise HTTPException(
                status_code=503,
                detail="Models not initialized",
            )

        historical_data = _db_connection.get_business_metrics()
        if len(historical_data) < MIN_TRAINING_MONTHS:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA,
            )

        sales_mape = _sales_model.train(historical_data)
        cost_mape = _cost_model.train(historical_data)

        os.makedirs("trained_models", exist_ok=True)
        _sales_model.save_model("trained_models/sales_forecast_model.pt")
        _cost_model.save_model("trained_models/cost_forecast_model.pt")

        logger.info(
            "Training complete. Sales MAPE: %s, Cost MAPE: %s",
            sales_mape,
            cost_mape,
        )

        return TrainingResponse(
            status="success",
            message="Models trained and saved successfully",
            sales_mape=sales_mape,
            cost_mape=cost_mape,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error during model training: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500, detail="Internal server error."
        ) from e


# Health Check Endpoint

@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AI Service",
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
