# AI Service

FastAPI-based AI service for the BusinessAI-Analytics platform providing forecasting and chatbot capabilities.

## Features

- **Sales Forecasting**: PyTorch LSTM model for 12-month sales predictions
- **Cost Forecasting**: TensorFlow LSTM model for 12-month cost predictions
- **Profit Forecasting**: Calculated from sales and cost forecasts
- **Chatbot**: Intent-based query processor with database and document search capabilities

## Requirements

- Python 3.9+
- FastAPI 0.104.1
- PyTorch 2.1.1
- TensorFlow 2.14.0
- MySQL 8.0

## Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

Update database connection settings in `main.py`:
```python
db_connection = DatabaseConnection(
    host="localhost",
    user="root",
    password="",
    database="businessai"
)
```

## Running the Service

1. Train models (first time only):
```bash
python -c "from main import *; import asyncio; asyncio.run(train_models())"
```

2. Start the service:
```bash
python main.py
```

The service will run on `http://localhost:8000`

## API Endpoints

### Forecasting

- `POST /api/ai/forecast/sales` - Generate 12-month sales forecast
- `POST /api/ai/forecast/costs` - Generate 12-month cost forecast
- `POST /api/ai/forecast/profit` - Generate 12-month profit forecast

### Chatbot

- `POST /api/ai/chatbot/query` - Process natural language question

### Training

- `POST /api/ai/train` - Train forecasting models

### Health

- `GET /health` - Health check endpoint

## Testing

Run tests with pytest:
```bash
pytest tests/
```

Run property-based tests:
```bash
pytest tests/ -m pbt
```

## Project Structure

```
ai-service/
├── main.py                 # FastAPI application
├── database.py             # Database connection and queries
├── models/
│   ├── sales_forecast.py   # PyTorch LSTM sales model
│   └── cost_forecast.py    # TensorFlow LSTM cost model
├── chatbot/
│   ├── intent_classifier.py # Intent classification
│   └── query_processor.py   # Query processing and routing
├── tests/
│   ├── test_training_data_split.py
│   ├── test_profit_forecast.py
│   ├── test_forecast_response_structure.py
│   ├── test_chatbot_intent_classification.py
│   └── test_document_search_ranking.py
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## Model Training

Models are trained on historical business metrics data with:
- 80/20 train/validation split
- 12-month sequence length
- 2-layer LSTM architecture (64 units each)
- Target MAPE < 20%

## Chatbot Intent Classification

The chatbot classifies questions into:
- `sales_metrics` - Questions about sales, revenue, profit
- `product_info` - Questions about products and inventory
- `customer_info` - Questions about customers and segments
- `document_search` - Questions about uploaded documents
- `mixed` - Questions combining multiple domains

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 400: Bad request (validation error, insufficient data)
- 500: Server error
- 503: Service unavailable (models not loaded)

## Logging

All operations are logged to console with timestamps and log levels.
