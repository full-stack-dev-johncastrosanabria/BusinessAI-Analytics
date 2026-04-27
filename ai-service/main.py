"""
FastAPI AI Service for BusinessAI-Analytics Platform
Provides forecasting and chatbot capabilities
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from datetime import datetime

from database import DatabaseConnection
from models.hybrid_forecast import HybridForecastModel
from chatbot.intent_classifier import IntentClassifier, AdvancedIntentClassifier
from chatbot.query_processor import QueryProcessor
from chatbot.advanced_query_processor import AdvancedQueryProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ── Constants for repeated strings ──────────────────────────────────────────
INSUFFICIENT_TRAINING_DATA = "Insufficient training data. Need at least 24 months of historical data."

# Initialize FastAPI app
app = FastAPI(
    title="BusinessAI Analytics AI Service",
    description="AI Service for forecasting and chatbot capabilities",
    version="1.0.0"
)

# Note: CORS is handled by API Gateway, not needed here

# Initialize components
db_connection = None
sales_model = None
cost_model = None
intent_classifier = None
query_processor = None
advanced_classifier = None
advanced_query_processor = None


# Request/Response Models
class ForecastPrediction(BaseModel):
    month: str
    value: float


class ForecastResponse(BaseModel):
    predictions: List[ForecastPrediction]
    mape: Optional[float] = None


class ChatbotQueryRequest(BaseModel):
    question: str


class ChatbotQueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[str] = []
    processing_time: float = 0.0


class TrainingRequest(BaseModel):
    force_retrain: bool = False


class TrainingResponse(BaseModel):
    status: str
    message: str
    sales_mape: Optional[float] = None
    cost_mape: Optional[float] = None


@app.on_event("startup")
async def startup_event():
    """Initialize database connection and load models on startup"""
    global db_connection, sales_model, cost_model, intent_classifier, query_processor
    global advanced_classifier, advanced_query_processor
    
    try:
        logger.info("Initializing AI Service...")
        
        # Initialize database connection
        db_connection = DatabaseConnection()
        logger.info("Database connection initialized")
        
        # Load or initialize models
        sales_model = HybridForecastModel(sequence_length=12)
        cost_model = HybridForecastModel(sequence_length=12)
        
        # Try to load pre-trained models
        if os.path.exists("trained_models/sales_forecast_model.pt"):
            sales_model.load_model("trained_models/sales_forecast_model.pt")
            logger.info("Sales model loaded from disk")
        else:
            logger.warning("Sales model not found, will need training")
        
        if os.path.exists("trained_models/cost_forecast_model.pt"):
            cost_model.load_model("trained_models/cost_forecast_model.pt")
            logger.info("Cost model loaded from disk")
        else:
            logger.warning("Cost model not found, will need training")
        
        # Initialize chatbot components (both standard and advanced)
        intent_classifier = IntentClassifier()
        query_processor = QueryProcessor(db_connection)
        
        # Initialize advanced multilingual components
        advanced_classifier = AdvancedIntentClassifier()
        advanced_query_processor = AdvancedQueryProcessor(db_connection)
        
        logger.info("Chatbot components initialized (standard + advanced multilingual)")
        
        logger.info("AI Service startup complete")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}", exc_info=True)
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    global db_connection
    if db_connection:
        db_connection.close()
        logger.info("Database connection closed")


# Forecast Endpoints

@app.post("/api/ai/forecast/sales", 
          response_model=ForecastResponse,
          responses={
              400: {"description": "Insufficient training data"},
              500: {"description": "Internal server error"},
              503: {"description": "Sales model not loaded"}
          })
async def forecast_sales():
    """
    Generate 12-month sales forecast
    
    Returns:
        ForecastResponse: 12 monthly sales predictions with MAPE metric
    """
    try:
        if sales_model is None:
            raise HTTPException(
                status_code=503,
                detail="Sales model not loaded. Please train the model first."
            )
        
        # Get historical data
        historical_data = db_connection.get_business_metrics()
        if len(historical_data) < 24:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA
            )
        
        # Generate forecast
        predictions, mape = sales_model.forecast(historical_data)
        
        # Format response
        forecast_data = []
        for i, value in enumerate(predictions):
            month_offset = i + 1
            forecast_data.append(ForecastPrediction(
                month=f"2024-{(month_offset % 12) + 1:02d}",
                value=float(value)
            ))
        
        logger.info(f"Sales forecast generated with MAPE: {mape}")
        return ForecastResponse(predictions=forecast_data, mape=mape)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating sales forecast: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/forecast/costs", 
          response_model=ForecastResponse,
          responses={
              400: {"description": "Insufficient training data"},
              500: {"description": "Internal server error"},
              503: {"description": "Cost model not loaded"}
          })
async def forecast_costs():
    """
    Generate 12-month cost forecast
    
    Returns:
        ForecastResponse: 12 monthly cost predictions with MAPE metric
    """
    try:
        if cost_model is None:
            raise HTTPException(
                status_code=503,
                detail="Cost model not loaded. Please train the model first."
            )
        
        # Get historical data
        historical_data = db_connection.get_business_metrics()
        if len(historical_data) < 24:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA
            )
        
        # Try to generate forecast
        try:
            predictions, mape = cost_model.forecast(historical_data)
        except ImportError as ie:
            # TensorFlow not available - return simple projection based on historical average
            logger.warning(f"TensorFlow not available, using simple projection: {ie}")
            avg_cost = sum(historical_data) / len(historical_data)
            predictions = [avg_cost * 1.02 ** i for i in range(12)]  # 2% growth projection
            mape = None
        
        # Format response
        forecast_data = []
        for i, value in enumerate(predictions):
            month_offset = i + 1
            forecast_data.append(ForecastPrediction(
                month=f"2024-{(month_offset % 12) + 1:02d}",
                value=float(value)
            ))
        
        logger.info(f"Cost forecast generated with MAPE: {mape}")
        return ForecastResponse(predictions=forecast_data, mape=mape)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating cost forecast: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/forecast/profit", 
          response_model=ForecastResponse,
          responses={
              400: {"description": "Insufficient training data"},
              500: {"description": "Internal server error"},
              503: {"description": "Models not loaded"}
          })
async def forecast_profit():
    """
    Generate 12-month profit forecast by subtracting cost from sales
    
    Returns:
        ForecastResponse: 12 monthly profit predictions
    """
    try:
        if sales_model is None or cost_model is None:
            raise HTTPException(
                status_code=503,
                detail="Models not loaded. Please train the models first."
            )
        
        # Get historical data
        historical_data = db_connection.get_business_metrics()
        if len(historical_data) < 24:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA
            )
        
        # Generate sales forecast
        sales_predictions, _ = sales_model.forecast(historical_data)
        
        # Generate cost forecast with fallback for TensorFlow unavailability
        try:
            cost_predictions, _ = cost_model.forecast(historical_data)
        except ImportError as ie:
            # TensorFlow not available - use simple projection
            logger.warning(f"TensorFlow not available for cost forecast, using simple projection: {ie}")
            avg_cost = sum(historical_data) / len(historical_data)
            cost_predictions = [avg_cost * 1.02 ** i for i in range(12)]  # 2% growth projection
        
        # Calculate profit
        profit_predictions = sales_predictions - cost_predictions
        
        # Format response
        forecast_data = []
        for i, value in enumerate(profit_predictions):
            month_offset = i + 1
            forecast_data.append(ForecastPrediction(
                month=f"2024-{(month_offset % 12) + 1:02d}",
                value=float(value)
            ))
        
        logger.info("Profit forecast generated")
        return ForecastResponse(predictions=forecast_data)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating profit forecast: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Chatbot Endpoints

@app.post("/api/ai/chatbot/query", 
          response_model=ChatbotQueryResponse,
          responses={
              500: {"description": "Internal server error"},
              503: {"description": "Chatbot not initialized"}
          })
async def process_chatbot_query(request: ChatbotQueryRequest):
    """
    Process a natural language question and return an answer
    Supports both English and Spanish with automatic language detection
    
    Args:
        request: ChatbotQueryRequest with the question
    
    Returns:
        ChatbotQueryResponse: Answer with sources and processing time
    """
    try:
        start_time = datetime.now()
        
        if advanced_query_processor is None:
            raise HTTPException(
                status_code=503,
                detail="Chatbot not initialized"
            )
        
        # Process query with advanced multilingual processor
        answer, sources = await advanced_query_processor.process_query(request.question)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"Chatbot query processed in {processing_time:.2f}s")
        return ChatbotQueryResponse(
            question=request.question,
            answer=answer,
            sources=sources,
            processing_time=processing_time
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chatbot query: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Training Endpoint

@app.post("/api/ai/train", 
          response_model=TrainingResponse,
          responses={
              400: {"description": "Insufficient training data"},
              500: {"description": "Internal server error"},
              503: {"description": "Models not initialized"}
          })
async def train_models(request: TrainingRequest = None):
    """
    Train both sales and cost forecasting models
    
    Args:
        request: TrainingRequest with optional force_retrain flag
    
    Returns:
        TrainingResponse: Training status and MAPE metrics
    """
    try:
        logger.info("Starting model training...")
        
        if sales_model is None or cost_model is None:
            raise HTTPException(
                status_code=503,
                detail="Models not initialized"
            )
        
        # Get historical data
        historical_data = db_connection.get_business_metrics()
        if len(historical_data) < 24:
            raise HTTPException(
                status_code=400,
                detail=INSUFFICIENT_TRAINING_DATA
            )
        
        # Train models
        sales_mape = sales_model.train_model(historical_data)
        cost_mape = cost_model.train_model(historical_data)
        
        # Save models
        os.makedirs("models", exist_ok=True)
        sales_model.save_model("models/sales_model.pth")
        cost_model.save_model("models/cost_model.h5")
        
        logger.info(f"Training complete. Sales MAPE: {sales_mape}, Cost MAPE: {cost_mape}")
        
        return TrainingResponse(
            status="success",
            message="Models trained and saved successfully",
            sales_mape=sales_mape,
            cost_mape=cost_mape
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during model training: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Health Check Endpoint

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Service",
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
