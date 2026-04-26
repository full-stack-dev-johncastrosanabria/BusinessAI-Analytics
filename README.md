# BusinessAI-Analytics Platform

Plataforma de inteligencia empresarial con arquitectura de microservicios, pronósticos con IA y asistente conversacional bilingüe (inglés/español).

## Arquitectura

```
Frontend (5173)
    └── API Gateway (8080)
            ├── Product Service   (8081)
            ├── Customer Service  (8082)
            ├── Sales Service     (8083)
            ├── Analytics Service (8084)
            ├── Document Service  (8085)
            └── AI Service        (8000)
                    └── MySQL (3306)
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

# 3. Exportar contraseña de MySQL
export MYSQL_PASSWORD=tu_contraseña

# 4. Iniciar todo el sistema
./start-system.sh
```

La aplicación estará disponible en **http://localhost:5173**

### Uso diario

```bash
export MYSQL_PASSWORD=tu_contraseña

./start-system.sh      # Iniciar
./check-system.sh      # Ver estado
./stop-system.sh       # Detener
./stop-system.sh --force  # Forzar detención
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
- Pronóstico de costos a 12 meses — modelo TensorFlow LSTM
- Pronóstico de ganancias calculado automáticamente
- Métrica de precisión MAPE

### Asistente empresarial (Chatbot)
- Consultas en lenguaje natural en inglés y español
- Acceso directo a base de datos (ventas, productos, clientes)
- Búsqueda en documentos subidos
- Soporte para preguntas por mes, trimestre, año, comparaciones y tendencias

**Ejemplos de preguntas:**
```
¿Cuánto vendimos en total en 2024?
¿Cuál fue nuestro mes más rentable?
¿Qué categoría de productos genera más ingresos?
¿Qué clientes son del segmento Enterprise?
Compare sales between January and June 2024
What was our worst performing month ever?
Who are our top customers by number of orders?
```

### Gestión de documentos
- Subida de archivos TXT, DOCX, PDF, XLSX (máx. 50 MB)
- Extracción automática de texto
- Búsqueda full-text en contenido

### Gestión de datos
- CRUD de productos, clientes y transacciones de ventas
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
| `sales_transactions` | 5 000     | 5 años de transacciones con tendencias   |
| `business_metrics`   | 60        | Métricas mensuales agregadas             |
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

| Servicio           | Tests |
|--------------------|-------|
| Product Service    | 56    |
| Customer Service   | 55    |
| Sales Service      | 78    |
| Analytics Service  | 32    |
| Document Service   | 25    |
| API Gateway        | 69    |
| AI Service         | 105   |
| Frontend           | 82    |
| **Total**          | **502** |

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
├── api-gateway/           # Spring Cloud Gateway
├── product-service/       # Microservicio productos
├── customer-service/      # Microservicio clientes
├── sales-service/         # Microservicio ventas
├── analytics-service/     # Microservicio analítica
├── document-service/      # Microservicio documentos
├── ai-service/            # FastAPI + modelos LSTM
├── frontend/              # React TypeScript SPA
└── logs/                  # Logs en tiempo de ejecución
```
