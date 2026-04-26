# AI Service

Servicio Python (FastAPI) que provee pronósticos con modelos LSTM y un asistente empresarial bilingüe con acceso a base de datos y documentos.

## Stack

- Python 3.9+ · FastAPI · PyTorch · MySQL 8.0
- Puerto: **8000**

## Instalación

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuración

La contraseña de MySQL se lee desde la variable de entorno:

```bash
export MYSQL_PASSWORD=tu_contraseña
```

## Ejecución

```bash
# Primera vez: entrenar modelos
source .venv/bin/activate
python train_models.py

# Iniciar servicio
MYSQL_PASSWORD=tu_contraseña .venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Endpoints

### Pronósticos

| Método | Ruta                      | Descripción                        |
|--------|---------------------------|------------------------------------|
| POST   | `/api/ai/forecast/sales`  | Pronóstico de ventas a 12 meses    |
| POST   | `/api/ai/forecast/costs`  | Pronóstico de costos a 12 meses    |
| POST   | `/api/ai/forecast/profit` | Pronóstico de ganancias a 12 meses |
| POST   | `/api/ai/train`           | Entrenar modelos (admin)           |

### Chatbot

| Método | Ruta                      | Descripción                        |
|--------|---------------------------|------------------------------------|
| POST   | `/api/ai/chatbot/query`   | Consulta en lenguaje natural       |

**Ejemplo:**
```bash
curl -X POST http://localhost:8000/api/ai/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Cuál fue nuestro mes más rentable?"}'
```

### Health

```bash
GET /health
```

## Chatbot — Capacidades

El asistente entiende preguntas en **inglés y español** y consulta la base de datos en tiempo real.

### Tipos de consultas soportadas

| Categoría       | Ejemplos                                                        |
|-----------------|-----------------------------------------------------------------|
| Ventas/ingresos | "¿Cuánto vendimos en 2024?", "Sales for Q3 2023"               |
| Mes específico  | "¿Cuánto fue la ganancia en marzo 2024?"                        |
| Trimestre       | "Show me sales performance for Q3 2023"                         |
| Año completo    | "What is our total revenue for 2024?"                           |
| Comparación     | "Compare sales between January and June 2024"                   |
| Tendencias      | "¿Cuál es la tendencia de ventas de los últimos 6 meses?"       |
| Mejor/peor mes  | "¿Cuál fue nuestro mes más rentable?", "Worst performing month" |
| Margen promedio | "What is our average profit margin across all months?"          |
| Productos       | "¿Cuál es nuestro producto más vendido?", "Top products"        |
| Categorías      | "¿Qué categoría genera más ingresos?"                           |
| Clientes        | "Who is our best customer?", "¿Quién es nuestro mejor cliente?" |
| Por segmento    | "¿Qué clientes son del segmento Enterprise?"                    |
| Por país        | "Which customers are from the USA?"                             |
| Por pedidos     | "Top customers by number of orders"                             |
| Documentos      | "¿Qué documentos tenemos sobre contratos?"                      |

## Modelos de IA

### Sales Forecast (PyTorch LSTM)
- Arquitectura: 2 capas LSTM, 64 unidades cada una
- Entrenamiento: split 80/20 train/validación
- Secuencia de entrada: 12 meses
- Métrica objetivo: MAPE < 20%
- Modelo guardado en: `trained_models/sales_forecast_model.pt`

### Cost Forecast (TensorFlow LSTM)
- Misma arquitectura que el modelo de ventas
- Nota: TensorFlow no es compatible con Python 3.14 — el modelo de costos requiere Python ≤ 3.12

## Estructura

```
ai-service/
├── main.py                          # Aplicación FastAPI y endpoints
├── database.py                      # Conexión MySQL y queries
├── train_models.py                  # Script de entrenamiento
├── chatbot/
│   ├── intent_classifier.py         # Clasificador de intención bilingüe (1 485 líneas)
│   └── advanced_query_processor.py  # Procesador de consultas con acceso a BD
├── models/
│   ├── sales_forecast.py            # Modelo LSTM PyTorch
│   └── cost_forecast.py             # Modelo LSTM TensorFlow
├── trained_models/
│   └── sales_forecast_model.pt      # Pesos del modelo entrenado
├── tests/                           # 105 tests (pytest)
├── requirements.txt
└── pytest.ini
```

## Tests

```bash
source .venv/bin/activate
pytest tests/
pytest tests/ -m pbt   # Solo property-based tests
```

| Archivo de test                          | Tests |
|------------------------------------------|-------|
| test_unit_endpoints.py                   | 17    |
| test_forecast_response_structure.py      | 9     |
| test_chatbot_intent_classification.py    | 4     |
| test_document_search_ranking.py          | 4     |
| test_profit_forecast.py                  | 8     |
| test_training_data_split.py              | 4     |
| test_ai_service_integration.py           | Variable |
| **Total**                                | **105+** |

## Solución de problemas

**Servicio no inicia:**
```bash
tail -50 logs/ai-service.log
# Verificar que MYSQL_PASSWORD esté exportado
```

**Modelos no entrenados:**
```bash
source .venv/bin/activate
python train_models.py
```

**TensorFlow no disponible (Python 3.14):**
El pronóstico de costos no funcionará. El pronóstico de ventas (PyTorch) sí es compatible.
