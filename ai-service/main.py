"""
FastAPI AI Service for BusinessAI-Analytics Platform
Provides forecasting and chatbot capabilities
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from datetime import datetime

from database import DatabaseConnection
from models.sales_forecast import SalesForecastModel
from models.cost_forecast import CostForecastModel
from chatbot.intent_classifier import IntentClassifier
from chatbot.query_processor import QueryProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="BusinessAI Analytics AI Service",
    description="AI Service for forecasting and chatbot capabilities",
    version="1.0.0"
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
db_connection = None
sales_model = None
cost_model = None
intent_classifier = None
query_processor = None


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
    
    try:
        logger.info("Initializing AI Service...")
        
        # Initialize database connection
        db_connection = DatabaseConnection()
        logger.info("Database connection initialized")
        
        # Load or initialize models
        sales_model = SalesForecastModel()
        cost_model = CostForecastModel()
        
        # Try to load pre-trained models
        if os.path.exists("models/sales_model.pth"):
            sales_model.load_model("models/sales_model.pth")
            logger.info("Sales model loaded from disk")
        else:
            logger.warning("Sales model not found, will need training")
        
        if os.path.exists("models/cost_model.h5"):
            cost_model.load_model("models/cost_model.h5")
            logger.info("Cost model loaded from disk")
        else:
            logger.warning("Cost model not found, will need training")
        
        # Initialize chatbot components
        intent_classifier = IntentClassifier()
        query_processor = QueryProcessor(db_connection)
        logger.info("Chatbot components initialized")
        
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

@app.post("/api/ai/forecast/sales", response_model=ForecastResponse)
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
                detail="Insufficient training data. Need at least 24 months of historical data."
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


@app.post("/api/ai/forecast/costs", response_model=ForecastResponse)
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
                detail="Insufficient training data. Need at least 24 months of historical data."
            )
        
        # Generate forecast
        predictions, mape = cost_model.forecast(historical_data)
        
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


@app.post("/api/ai/forecast/profit", response_model=ForecastResponse)
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
                detail="Insufficient training data. Need at least 24 months of historical data."
            )
        
        # Generate forecasts
        sales_predictions, _ = sales_model.forecast(historical_data)
        cost_predictions, _ = cost_model.forecast(historical_data)
        
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

@app.post("/api/ai/chatbot/query", response_model=ChatbotQueryResponse)
async def process_chatbot_query(request: ChatbotQueryRequest):
    """
    Process a natural language question and return an answer
    
    Args:
        request: ChatbotQueryRequest with the question
    
    Returns:
        ChatbotQueryResponse: Answer with sources and processing time
    """
    try:
        start_time = datetime.now()
        
        if query_processor is None:
            raise HTTPException(
                status_code=503,
                detail="Chatbot not initialized"
            )
        
        # Process query
        answer, sources = await query_processor.process_query(request.question)
        
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

@app.post("/api/ai/train", response_model=TrainingResponse)
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
                detail="Insufficient training data. Need at least 24 months of historical data."
            )
        
        # Train models
        sales_mape = sales_model.train(historical_data)
        cost_mape = cost_model.train(historical_data)
        
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
