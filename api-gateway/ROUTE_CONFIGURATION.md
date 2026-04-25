# API Gateway Route Configuration

## Overview

This document describes the route predicates and filters configured for the BusinessAI-Analytics API Gateway (Task 2.2).

## Route Predicates

All route predicates are configured in `src/main/resources/application.yml`. The gateway routes requests to six backend services:

### 1. Product Service (Port 8081)
- **Route ID**: `product-service`
- **Path Predicate**: `/api/products/**`
- **URI**: `http://localhost:8081`
- **Requirements**: 17.2

### 2. Customer Service (Port 8082)
- **Route ID**: `customer-service`
- **Path Predicate**: `/api/customers/**`
- **URI**: `http://localhost:8082`
- **Requirements**: 17.3

### 3. Sales Service (Port 8083)
- **Route ID**: `sales-service`
- **Path Predicate**: `/api/sales/**`
- **URI**: `http://localhost:8083`
- **Requirements**: 17.4

### 4. Analytics Service (Port 8084)
- **Route ID**: `analytics-service`
- **Path Predicate**: `/api/analytics/**`
- **URI**: `http://localhost:8084`
- **Requirements**: 17.5

### 5. Document Service (Port 8085)
- **Route ID**: `document-service`
- **Path Predicate**: `/api/documents/**`
- **URI**: `http://localhost:8085`
- **Requirements**: 17.6

### 6. AI Service (Port 8000)
- **Route ID**: `ai-service`
- **Path Predicate**: `/api/ai/**`
- **URI**: `http://localhost:8000`
- **Requirements**: 17.7

## Route-Specific Filters

Each route is configured with retry filters to handle transient failures:

### Retry Configuration (Microservices: Ports 8081-8085)
- **Retries**: 3 attempts
- **Retry Statuses**: BAD_GATEWAY, GATEWAY_TIMEOUT
- **Methods**: GET, POST, PUT, DELETE
- **Backoff Strategy**: Exponential
  - First backoff: 50ms
  - Max backoff: 500ms
  - Factor: 2

### Retry Configuration (AI Service: Port 8000)
- **Retries**: 2 attempts (fewer due to longer processing times)
- **Retry Statuses**: BAD_GATEWAY, GATEWAY_TIMEOUT
- **Methods**: GET, POST
- **Backoff Strategy**: Exponential
  - First backoff: 100ms
  - Max backoff: 1000ms
  - Factor: 2

## Global Configuration

### CORS Configuration
- **Allowed Origins**: `http://localhost:5173` (React frontend)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: All (`*`)
- **Allow Credentials**: true
- **Max Age**: 3600 seconds

### HTTP Client Configuration
- **Connect Timeout**: 5000ms (5 seconds)
- **Response Timeout**: 30 seconds

### Actuator Endpoints
- **Exposed Endpoints**: health, info, gateway
- **Health Details**: Always shown

### Logging
- **Root Level**: INFO
- **Spring Cloud Gateway**: DEBUG
- **Spring Web**: DEBUG
- **Pattern**: `%d{yyyy-MM-dd HH:mm:ss} - %msg%n`

## Design Rationale

### Retry Filters
Retry filters implement resilience patterns to handle transient network failures and temporary service unavailability. The exponential backoff strategy prevents overwhelming downstream services during recovery.

### Timeout Configuration
- **Connect timeout (5s)**: Prevents hanging on unresponsive services
- **Response timeout (30s)**: Accommodates longer-running operations like AI forecasting and document processing

### AI Service Differences
The AI Service has:
- Fewer retry attempts (2 vs 3) due to longer processing times
- Longer backoff intervals to account for model inference latency
- Only GET and POST methods (no PUT/DELETE operations)

## Testing

To verify route configuration:

1. **Start the API Gateway**:
   ```bash
   cd api-gateway
   ./mvnw spring-boot:run
   ```

2. **Check Gateway Routes** (via Actuator):
   ```bash
   curl http://localhost:8080/actuator/gateway/routes
   ```

3. **Test Route Predicates**:
   ```bash
   # Product Service
   curl http://localhost:8080/api/products
   
   # Customer Service
   curl http://localhost:8080/api/customers
   
   # Sales Service
   curl http://localhost:8080/api/sales
   
   # Analytics Service
   curl http://localhost:8080/api/analytics/metrics
   
   # Document Service
   curl http://localhost:8080/api/documents
   
   # AI Service
   curl http://localhost:8080/api/ai/chatbot/query
   ```

## References

- **Requirements**: 17.2, 17.3, 17.4, 17.5, 17.6, 17.7
- **Design Document**: `.kiro/specs/business-ai-analytics/design.md` (API Gateway Design section)
- **Spring Cloud Gateway Documentation**: https://spring.io/projects/spring-cloud-gateway
