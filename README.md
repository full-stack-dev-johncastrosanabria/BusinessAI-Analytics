# BusinessAI-Analytics Platform

Plataforma de inteligencia empresarial con arquitectura de microservicios, pronósticos con IA y asistente conversacional bilingüe (inglés/español).

## Arquitectura

```
Frontend (5173)
    └── API Gateway (8080)
            ├── Product Service   (8081)  → /api/products/**
            ├── Customer Service  (8082)  → /api/customers/**
            ├── Sales Service     (8083)  → /api/sales/**
            ├── Analytics Service (8084)  → /api/analytics/**
            ├── Document Service  (8085)  → /api/documents/**
            └── AI Service        (8000)  → /api/ai/**
                    └── MySQL (3306) — businessai
```

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Java        | 17             |
| Maven       | 3.6            |
| Node.js     | 18             |
| Python      | 3.9            |
| MySQL       | 8.0            |

## Inicio rápido

### Primera vez

```bash
# 1. Crear base de datos y cargar esquema
mysql -u root -p < database/schema.sql

# 2. Generar datos sintéticos
python3 database/generate_seed_data.py

# 3. Iniciar todo el sistema
MYSQL_PASSWORD=tu_contraseña ./start-system.sh
```

La aplicación estará disponible en **http://localhost:5173**

### Uso diario

```bash
MYSQL_PASSWORD=tu_contraseña ./start-system.sh   # Iniciar
./check-system.sh                                 # Ver estado
./stop-system.sh                                  # Detener
./stop-system.sh --force                          # Forzar detención
```

## Puertos de servicios

| Servicio           | Puerto | URL                    |
|--------------------|--------|------------------------|
| Frontend           | 5173   | http://localhost:5173  |
| API Gateway        | 8080   | http://localhost:8080  |
| Product Service    | 8081   | http://localhost:8081  |
| Customer Service   | 8082   | http://localhost:8082  |
| Sales Service      | 8083   | http://localhost:8083  |
| Analytics Service  | 8084   | http://localhost:8084  |
| Document Service   | 8085   | http://localhost:8085  |
| AI Service         | 8000   | http://localhost:8000  |

## Funcionalidades

### Dashboard
- Métricas de ventas, costos y ganancias por período
- Identificación del mejor y peor mes
- Top 5 productos por ingresos
- Gráficos de tendencias con filtro de fechas

### Pronósticos (AI)
- Pronóstico de ventas a 12 meses — modelo PyTorch LSTM
- Pronóstico de costos a 12 meses — modelo PyTorch LSTM
- Pronóstico de ganancias calculado automáticamente
- Métrica de precisión MAPE

### Asistente empresarial (Chatbot)
Consultas en lenguaje natural en inglés y español con respuestas específicas de la base de datos.

**Ejemplos de preguntas:**
```
¿Cuál fue el mes con peor utilidad?
¿Qué mes estuvo más cerca de pérdida?
¿Cuánto se facturó este mes?
¿Cuál fue la factura o venta más alta?
¿Qué producto se facturó más?
¿Qué día tuvimos más ventas?
¿Hay ventas muy pequeñas que no valen la pena?
What was our best performing month?
Which product generates the most revenue?
```

### Gestión de documentos
- Subida de archivos TXT, DOCX, PDF, XLSX (máx. 50 MB)
- Extracción automática de texto
- Búsqueda full-text en contenido

### Gestión de datos
- CRUD completo de productos, clientes y transacciones de ventas
- Validación de email único en clientes
- Cálculo automático de totales en transacciones

## Scripts de automatización

| Script              | Descripción                                      |
|---------------------|--------------------------------------------------|
| `start-system.sh`   | Inicia todos los servicios en orden correcto     |
| `stop-system.sh`    | Detiene todos los servicios (graceful o forzado) |
| `check-system.sh`   | Muestra estado de cada servicio y puerto         |
| `setup-database.sh` | Crea la base de datos, esquema y datos semilla   |

Todos los logs se guardan en `./logs/`.

## Base de datos

Esquema con 5 tablas principales:

| Tabla                | Registros | Descripción                              |
|----------------------|-----------|------------------------------------------|
| `products`           | 30        | Catálogo: Electronics, Furniture, etc.   |
| `customers`          | 100       | Segmentos: Enterprise, SMB, Startup      |
| `sales_transactions` | 5 000+    | Transacciones con tendencias históricas  |
| `business_metrics`   | 97        | Métricas mensuales (Ene 2018 – Abr 2026) |
| `documents`          | Variable  | Documentos subidos con texto extraído    |

Para regenerar datos sintéticos:
```bash
python3 database/generate_seed_data.py
```

## Configuración de base de datos

Cada microservicio Java usa `application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/businessai
    username: root
    password: ${MYSQL_PASSWORD:}
```

El AI Service lee la contraseña desde la variable de entorno:
```bash
export MYSQL_PASSWORD=tu_contraseña
```

## Tests

```bash
# Microservicios Java (desde cada directorio)
mvn test

# AI Service
cd ai-service && pytest

# Frontend
cd frontend && npm test
```

## Solución de problemas

**Puerto en uso:**
```bash
lsof -i :8080
./stop-system.sh --force
./start-system.sh
```

**Base de datos inaccesible:**
```bash
mysql -u root -p -e "SHOW DATABASES;"
mysql -u root -p < database/schema.sql
```

**AI Service no inicia:**
```bash
tail -50 logs/ai-service.log
# Verificar que MYSQL_PASSWORD esté exportado
export MYSQL_PASSWORD=tu_contraseña
```

**Modelos de IA no entrenados:**
```bash
cd ai-service
source .venv/bin/activate
python train_models.py
```

**Frontend no compila:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Estructura del proyecto

```
BusinessAI-Analytics/
├── start-system.sh
├── stop-system.sh
├── check-system.sh
├── setup-database.sh
├── database/              # Esquema SQL y generador de datos
├── api-gateway/           # Spring Cloud Gateway (8080)
├── product-service/       # Microservicio productos (8081)
├── customer-service/      # Microservicio clientes (8082)
├── sales-service/         # Microservicio ventas (8083)
├── analytics-service/     # Microservicio analítica (8084)
├── document-service/      # Microservicio documentos (8085)
├── ai-service/            # FastAPI + modelos LSTM (8000)
├── frontend/              # React 19 TypeScript SPA (5173)
└── logs/                  # Logs en tiempo de ejecución
```
