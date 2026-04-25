# BusinessAI-Analytics Platform

A comprehensive business intelligence platform combining microservices architecture, AI-powered forecasting, and conversational interfaces for business data management and analytics.

## System Architecture

The platform consists of:

- **Frontend**: React TypeScript SPA (port 5173)
- **API Gateway**: Spring Cloud Gateway (port 8080)
- **Microservices**: 5 independent Spring Boot services (ports 8081-8085)
  - Product Service (8081)
  - Customer Service (8082)
  - Sales Service (8083)
  - Analytics Service (8084)
  - Document Service (8085)
- **AI Service**: Python FastAPI (port 8000)
- **Database**: MySQL 8.0

## Prerequisites

- Java 17
- Node.js 18+
- Python 3.9+
- MySQL 8.0

## Quick Start

### 1. Database Setup

```bash
# Create database and schema
mysql -u root -p < database/schema.sql

# Load synthetic data
mysql -u root -p businessai < database/seed_data.sql
```

### 2. Backend Services

Each microservice can be started independently:

```bash
# Product Service
cd product-service
mvn spring-boot:run

# Customer Service
cd customer-service
mvn spring-boot:run

# Sales Service
cd sales-service
mvn spring-boot:run

# Analytics Service
cd analytics-service
mvn spring-boot:run

# Document Service
cd document-service
mvn spring-boot:run

# API Gateway
cd api-gateway
mvn spring-boot:run
```

### 3. AI Service

```bash
cd ai-service

# Install dependencies
pip install -r requirements.txt

# Train models
python train_models.py

# Start service
python main.py
```

### 4. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Features

### Dashboard
- View total sales, costs, and profit metrics
- Identify best and worst performing months
- See top 5 products by revenue
- Interactive charts for trend analysis
- Date range filtering

### Forecasting
- 12-month sales forecast using PyTorch LSTM
- 12-month cost forecast using TensorFlow LSTM
- Profit forecast calculated from sales and cost predictions
- MAPE metrics for model accuracy

### Document Management
- Upload documents (TXT, DOCX, PDF, XLSX)
- Automatic text extraction
- Document search and retrieval

### Chatbot
- Natural language query processing
- Database query capability
- Document search integration
- Conversation history

### Data Management
- Product CRUD operations
- Customer management with email validation
- Sales transaction recording
- Business metrics tracking

## API Documentation

See [API Documentation](./docs/api.md) for detailed endpoint specifications.

## Architecture Documentation

See [Architecture Documentation](./docs/architecture.md) for system design details.

## Testing

### Run All Tests

```bash
# Backend services
cd [service-name]
mvn test

# Frontend
cd frontend
npm run test

# AI Service
cd ai-service
pytest
```

### Integration Tests

```bash
# Run integration tests for all services
mvn verify
```

## Project Structure

```
.
├── api-gateway/              # Spring Cloud Gateway
├── product-service/          # Product microservice
├── customer-service/         # Customer microservice
├── sales-service/            # Sales microservice
├── analytics-service/        # Analytics microservice
├── document-service/         # Document microservice
├── ai-service/               # Python FastAPI service
├── frontend/                 # React TypeScript SPA
├── database/                 # Database schema and seed data
├── docs/                     # Documentation
└── README.md                 # This file
```

## Configuration

### Database Connection

Update database credentials in each service's `application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/businessai
    username: root
    password: your_password
```

### AI Service Configuration

Update database connection in `ai-service/database.py`:

```python
db = DatabaseConnection(
    host="localhost",
    user="root",
    password="your_password",
    database="businessai"
)
```

### Frontend API Configuration

The frontend is configured to connect to the API Gateway at `http://localhost:8080`. Update in `frontend/src/services/api.ts` if needed.

## Troubleshooting

### Port Already in Use

If a port is already in use, you can change the port in the service configuration:

- **Frontend**: Update `frontend/vite.config.ts`
- **Backend Services**: Update `application.yml` in each service
- **AI Service**: Update `main.py`

### Database Connection Issues

Ensure MySQL is running and the database exists:

```bash
mysql -u root -p
CREATE DATABASE IF NOT EXISTS businessai;
```

### Model Training Issues

Ensure you have at least 24 months of historical data:

```bash
cd ai-service
python train_models.py
```

## Performance Considerations

- API Gateway implements request logging and error handling
- Sales Service validates references synchronously with Product and Customer services
- Analytics Service aggregates sales data into monthly metrics
- AI Service uses LSTM models for forecasting with 80/20 train/validation split
- Frontend uses React hooks for efficient state management

## Security Notes

- Email validation for customer records
- Foreign key constraints on sales transactions
- Input validation on all API endpoints
- Error handling with appropriate HTTP status codes

## Future Enhancements

- Authentication and authorization
- Real-time data updates with WebSockets
- Advanced analytics and reporting
- Mobile application
- Containerization with Docker
- Kubernetes deployment

## Support

For issues or questions, please refer to the documentation in the `docs/` directory or check individual service README files.

## License

This project is part of the BusinessAI Analytics platform.
