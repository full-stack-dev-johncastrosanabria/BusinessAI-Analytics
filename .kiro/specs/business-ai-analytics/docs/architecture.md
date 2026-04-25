# Architecture Documentation

## System Overview

The BusinessAI-Analytics platform is a full-stack business intelligence system built with a microservices architecture. The system enables companies to manage business data, visualize analytics, forecast performance using AI models, and interact with a chatbot.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (5173)                         │
│                  - Dashboard                                     │
│                  - Forecasts                                     │
│                  - Documents                                     │
│                  - Chatbot                                       │
│                  - CRUD Operations                               │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway (8080)                                  │
│         - Route Predicates                                       │
│         - CORS Configuration                                     │
│         - Request Logging                                        │
│         - Error Handling                                         │
└────────────────────────┬────────────────────────────────────────┘
         │               │               │               │               │
         ▼               ▼               ▼               ▼               ▼
    ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
    │Product │      │Customer│      │ Sales  │      │Analytics│     │Document│
    │Service │      │Service │      │Service │      │Service  │     │Service │
    │(8081)  │      │(8082)  │      │(8083)  │      │(8084)   │     │(8085)  │
    └────────┘      └────────┘      └────────┘      └────────┘      └────────┘
         │               │               │               │               │
         └───────────────┴───────────────┴───────────────┴───────────────┘
                         │ JDBC
                         ▼
                    ┌──────────────┐
                    │   MySQL      │
                    │  Database    │
                    └──────────────┘

                    ┌──────────────┐
                    │ AI Service   │
                    │   (8000)     │
                    │ - Forecasting│
                    │ - Chatbot    │
                    └──────────────┘
```

## Microservices Architecture

### 1. API Gateway (Port 8080)

**Technology**: Spring Cloud Gateway

**Responsibilities**:
- Route requests to appropriate microservices
- Handle CORS configuration
- Implement request/response logging
- Centralized error handling
- Load balancing

**Route Configuration**:
- `/api/products/**` → Product Service (8081)
- `/api/customers/**` → Customer Service (8082)
- `/api/sales/**` → Sales Service (8083)
- `/api/analytics/**` → Analytics Service (8084)
- `/api/documents/**` → Document Service (8085)
- `/api/ai/**` → AI Service (8000)

### 2. Product Service (Port 8081)

**Technology**: Spring Boot 3.x, JPA, MySQL

**Responsibilities**:
- Manage product CRUD operations
- Validate product data
- Provide product lookup for other services

**Key Entities**:
- Product (id, name, category, cost, price)

**REST Endpoints**:
- `POST /api/products` - Create product
- `GET /api/products/{id}` - Get product
- `GET /api/products` - List products
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### 3. Customer Service (Port 8082)

**Technology**: Spring Boot 3.x, JPA, MySQL

**Responsibilities**:
- Manage customer CRUD operations
- Validate email format
- Provide customer lookup for other services

**Key Entities**:
- Customer (id, name, email, segment, country)

**REST Endpoints**:
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}` - Get customer
- `GET /api/customers` - List customers
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### 4. Sales Service (Port 8083)

**Technology**: Spring Boot 3.x, JPA, MySQL, RestTemplate

**Responsibilities**:
- Record sales transactions
- Validate customer and product references
- Calculate transaction totals
- Filter sales data by date, customer, product

**Key Entities**:
- SalesTransaction (id, customerId, productId, transactionDate, quantity, totalAmount)

**Inter-Service Communication**:
- Calls Product Service to validate product exists
- Calls Customer Service to validate customer exists

**REST Endpoints**:
- `POST /api/sales` - Create transaction
- `GET /api/sales/{id}` - Get transaction
- `GET /api/sales` - List transactions with filters

### 5. Analytics Service (Port 8084)

**Technology**: Spring Boot 3.x, JPA, MySQL

**Responsibilities**:
- Manage business metrics
- Calculate profit from sales, costs, expenses
- Aggregate sales data into metrics
- Provide dashboard data

**Key Entities**:
- BusinessMetric (id, month, year, totalSales, totalCosts, totalExpenses, profit)

**REST Endpoints**:
- `POST /api/analytics/metrics` - Create metric
- `GET /api/analytics/metrics` - List metrics
- `GET /api/analytics/dashboard` - Get dashboard summary
- `POST /api/analytics/aggregate` - Aggregate sales data

### 6. Document Service (Port 8085)

**Technology**: Spring Boot 3.x, JPA, MySQL, Apache POI, PDFBox

**Responsibilities**:
- Handle document uploads
- Validate file formats
- Extract text from documents
- Store document metadata

**Key Entities**:
- Document (id, filename, uploadDate, fileSize, fileType, extractedText, extractionStatus, errorMessage)

**Supported Formats**:
- TXT (plain text)
- DOCX (Word documents)
- PDF (PDF files)
- XLSX (Excel spreadsheets)

**REST Endpoints**:
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/{id}` - Get document
- `GET /api/documents` - List documents
- `GET /api/documents/{id}/content` - Get extracted text
- `DELETE /api/documents/{id}` - Delete document

### 7. AI Service (Port 8000)

**Technology**: Python 3.9+, FastAPI, PyTorch, TensorFlow

**Responsibilities**:
- Train and serve forecasting models
- Generate sales, cost, and profit forecasts
- Process chatbot queries
- Query database for chatbot responses
- Search documents for chatbot responses

**Models**:
- **Sales Forecast**: PyTorch LSTM (2 layers, 64 units each)
- **Cost Forecast**: TensorFlow LSTM (2 layers, 64 units each)
- **Profit Forecast**: Calculated from sales and cost forecasts

**REST Endpoints**:
- `POST /api/ai/forecast/sales` - Generate sales forecast
- `POST /api/ai/forecast/costs` - Generate cost forecast
- `POST /api/ai/forecast/profit` - Generate profit forecast
- `POST /api/ai/chatbot/query` - Process chatbot query
- `POST /api/ai/train` - Trigger model training

## Database Schema

### Tables

1. **products**
   - id (PK)
   - name
   - category
   - cost
   - price
   - created_at, updated_at

2. **customers**
   - id (PK)
   - name
   - email (UNIQUE)
   - segment
   - country
   - created_at, updated_at

3. **sales_transactions**
   - id (PK)
   - customer_id (FK → customers)
   - product_id (FK → products)
   - transaction_date
   - quantity
   - total_amount
   - created_at

4. **business_metrics**
   - id (PK)
   - month
   - year
   - total_sales
   - total_costs
   - total_expenses
   - profit
   - created_at, updated_at
   - UNIQUE(month, year)

5. **documents**
   - id (PK)
   - filename
   - upload_date
   - file_size
   - file_type
   - extracted_text (MEDIUMTEXT)
   - extraction_status
   - error_message
   - FULLTEXT INDEX on extracted_text

### Relationships

```
products ──┐
           ├─→ sales_transactions
customers ─┘

documents (standalone)
business_metrics (aggregated from sales_transactions)
```

## Data Flow

### Sales Transaction Creation Flow

1. Frontend sends POST request to API Gateway `/api/sales`
2. API Gateway routes to Sales Service
3. Sales Service validates customer exists (calls Customer Service)
4. Sales Service validates product exists (calls Product Service)
5. Sales Service calculates total amount (quantity × product price)
6. Sales Service persists transaction to database
7. Response returned to frontend

### Forecasting Flow

1. Frontend sends POST request to API Gateway `/api/ai/forecast/sales`
2. API Gateway routes to AI Service
3. AI Service queries database for historical business metrics
4. AI Service loads pre-trained PyTorch model
5. AI Service generates 12-month predictions
6. AI Service calculates MAPE metric
7. Response with predictions and MAPE returned to frontend

### Chatbot Query Flow

1. Frontend sends POST request to API Gateway `/api/ai/chatbot/query`
2. API Gateway routes to AI Service
3. AI Service classifies query intent (sales, product, customer, document, mixed)
4. Based on intent:
   - Query database for relevant data
   - Search documents for relevant content
   - Combine results if mixed intent
5. AI Service formats response in natural language
6. Response returned to frontend

## Communication Patterns

### Synchronous (REST)

- Frontend ↔ API Gateway
- API Gateway ↔ Microservices
- Sales Service → Product Service (validation)
- Sales Service → Customer Service (validation)
- AI Service → MySQL Database (direct connection)

### Asynchronous

- Document text extraction (could be async in future)
- Model training (standalone script)

## Deployment Considerations

### Local Development

All services run on localhost with different ports. No containerization required.

### Production Deployment

- Containerize each service with Docker
- Use Kubernetes for orchestration
- Implement service discovery
- Add load balancing
- Implement circuit breakers for inter-service communication
- Add distributed tracing
- Implement centralized logging

## Scalability

### Horizontal Scaling

- Each microservice can be scaled independently
- API Gateway can handle multiple instances
- Database connection pooling for concurrent requests

### Vertical Scaling

- Increase memory/CPU for services with high load
- Optimize database queries with indexes
- Cache frequently accessed data

## Security

### Current Implementation

- Email validation for customer records
- Foreign key constraints on sales transactions
- Input validation on all endpoints
- Error handling with appropriate HTTP status codes

### Future Enhancements

- Authentication (JWT tokens)
- Authorization (role-based access control)
- API rate limiting
- Request encryption (HTTPS)
- Database encryption
- Audit logging

## Performance Optimization

### Database

- Indexes on frequently queried fields (dates, foreign keys)
- Connection pooling
- Query optimization

### API Gateway

- Request caching
- Response compression
- Connection pooling to backend services

### Frontend

- Code splitting
- Lazy loading of components
- Caching of API responses
- Optimized bundle size

### AI Service

- Model caching in memory
- Batch processing for forecasts
- Async request handling with FastAPI

## Monitoring and Logging

### Current Implementation

- Console logging in all services
- Error logging with stack traces

### Future Enhancements

- Centralized logging (ELK stack)
- Distributed tracing (Jaeger)
- Metrics collection (Prometheus)
- Alerting (PagerDuty)
- Health checks and readiness probes

## Technology Choices

### Why Microservices?

- Independent scalability
- Technology flexibility
- Fault isolation
- Easier testing and deployment
- Clear separation of concerns

### Why Spring Boot?

- Mature ecosystem
- Built-in features (JPA, REST, logging)
- Easy configuration
- Large community support

### Why Python for AI?

- Superior ML libraries (PyTorch, TensorFlow)
- Rapid development
- Excellent data science tools

### Why React?

- Component-based architecture
- Large ecosystem
- Developer experience
- Performance optimization tools

### Why MySQL?

- Relational data model fits business domain
- ACID compliance
- Mature and stable
- Good performance for this scale
