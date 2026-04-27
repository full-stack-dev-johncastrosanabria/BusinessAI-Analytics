# AI Service

FastAPI service providing AI-powered forecasting and bilingual business intelligence chatbot.

**Port**: 8000  
**Gateway path**: `/api/ai/**`

## Quick Start

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
MYSQL_PASSWORD=your_password python main.py
```

## Architecture

```
ai-service/
├── main.py                          # FastAPI app & endpoints
├── database.py                      # MySQL connection & queries
├── train_models.py                  # Model training script
├── chatbot/
│   ├── intent_classifier.py         # Bilingual intent classification
│   └── advanced_query_processor.py  # Query routing & handlers
├── models/
│   ├── hybrid_forecast.py           # Hybrid LSTM forecasting
│   ├── sales_forecast.py            # Sales LSTM model
│   └── cost_forecast_pytorch.py     # Cost LSTM model (PyTorch)
├── trained_models/
│   ├── sales_forecast_model.pt
│   └── cost_forecast_model.pt
├── tests/
└── requirements.txt
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/ai/forecast/sales` | 12-month sales forecast |
| POST | `/api/ai/forecast/costs` | 12-month cost forecast |
| POST | `/api/ai/forecast/profit` | 12-month profit forecast |
| POST | `/api/ai/chatbot/query` | Natural language query |
| POST | `/api/ai/train` | Retrain models |

### Chatbot Query

```bash
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Cuál fue el mes con peor utilidad?"}'
```

```json
{
  "question": "¿Cuál fue el mes con peor utilidad?",
  "answer": "📉 **Peor mes: Diciembre 2025**\n\n💰 Resultados:\n• Ganancia: $-13,891.24...",
  "sources": ["database:business_metrics"],
  "processing_time": 0.005
}
```

## Chatbot — Supported Questions

All questions work in both English and Spanish.

### Sales & Billing
- ¿Cuánto se facturó este mes?
- ¿Cuál fue la factura o venta más alta?
- ¿Qué día tuvimos más ventas?
- ¿Hay ventas muy pequeñas que no valen la pena?
- ¿Cuántas ventas hicimos por mes?

### Products
- ¿Qué producto se facturó más?
- ¿Qué categoría genera más ingresos?
- ¿Qué productos tienen mejor margen?

### Accounting & Profitability
- ¿Cuál fue el mes con peor utilidad?
- ¿Qué mes estuvo más cerca de pérdida?
- ¿Cuál fue el mes más rentable?
- ¿En qué meses tuvimos pérdidas?
- ¿Cuál es el punto de equilibrio?

### Customers
- ¿Quiénes son nuestros mejores clientes?
- ¿Qué segmento genera más ingresos?

### Forecasting
- ¿Cuáles son las ventas proyectadas?

## Forecasting Models

Both models use PyTorch LSTM:
- 2-layer LSTM, 64 hidden units
- 12-month sequence length
- Adam optimizer, MSE loss
- ~30% MAPE on historical data

### Training

```bash
source .venv/bin/activate
python train_models.py
```

## Database Methods

Key methods in `database.py`:

| Method | Description |
|--------|-------------|
| `get_sales_metrics()` | Last 12 months aggregated |
| `get_all_sales_metrics()` | Full history (97 months) |
| `get_best_worst_months()` | Best/worst by profit |
| `get_top_products_by_revenue()` | Top products ranked |
| `get_highest_transaction()` | Single highest sale |
| `get_sales_by_day()` | Daily sales aggregated |
| `get_small_transactions()` | Lowest value transactions |
| `get_top_customers_by_revenue()` | Top customers ranked |
| `get_segment_revenue_analysis()` | Revenue by segment |

## Environment Variables

```bash
MYSQL_PASSWORD=your_password   # Required
MYSQL_HOST=localhost            # Default: localhost
MYSQL_USER=root                 # Default: root
MYSQL_DATABASE=businessai       # Default: businessai
```

## Testing

```bash
source .venv/bin/activate
pytest tests/ -v
```

## Troubleshooting

**Service won't start:**
```bash
tail -50 logs/ai-service.log
# Ensure MYSQL_PASSWORD is set
```

**Models not trained:**
```bash
source .venv/bin/activate
python train_models.py
ls trained_models/
```

**Chatbot returning errors:**
```bash
# Test database connection
python3 -c "
import sys; sys.path.insert(0,'.')
from database import DatabaseConnection
db = DatabaseConnection(password='your_password')
print(db.get_all_sales_metrics()[:1])
"
```
