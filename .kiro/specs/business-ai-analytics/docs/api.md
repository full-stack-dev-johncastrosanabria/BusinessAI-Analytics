# API Documentation

## Base URL

All API endpoints are accessed through the API Gateway:

```
http://localhost:8080
```

## Response Format

All responses are in JSON format with the following structure:

### Success Response (2xx)

```json
{
  "data": {},
  "message": "Success"
}
```

### Error Response (4xx, 5xx)

```json
{
  "error": "Error message",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Product Service Endpoints

### Create Product

```
POST /api/products
Content-Type: application/json

{
  "name": "Laptop",
  "category": "Electronics",
  "cost": 800.00,
  "price": 1200.00
}
```

**Response (201)**:
```json
{
  "id": 1,
  "name": "Laptop",
  "category": "Electronics",
  "cost": 800.00,
  "price": 1200.00
}
```

### Get Product

```
GET /api/products/{id}
```

**Response (200)**:
```json
{
  "id": 1,
  "name": "Laptop",
  "category": "Electronics",
  "cost": 800.00,
  "price": 1200.00
}
```

### List Products

```
GET /api/products
```

**Response (200)**:
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "category": "Electronics",
    "cost": 800.00,
    "price": 1200.00
  },
  {
    "id": 2,
    "name": "Mouse",
    "category": "Accessories",
    "cost": 10.00,
    "price": 25.00
  }
]
```

### Update Product

```
PUT /api/products/{id}
Content-Type: application/json

{
  "name": "Laptop Pro",
  "category": "Electronics",
  "cost": 900.00,
  "price": 1400.00
}
```

**Response (200)**:
```json
{
  "id": 1,
  "name": "Laptop Pro",
  "category": "Electronics",
  "cost": 900.00,
  "price": 1400.00
}
```

### Delete Product

```
DELETE /api/products/{id}
```

**Response (204)**: No content

## Customer Service Endpoints

### Create Customer

```
POST /api/customers
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "segment": "Enterprise",
  "country": "USA"
}
```

**Response (201)**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "segment": "Enterprise",
  "country": "USA"
}
```

### Get Customer

```
GET /api/customers/{id}
```

**Response (200)**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "segment": "Enterprise",
  "country": "USA"
}
```

### List Customers

```
GET /api/customers
```

**Response (200)**:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "segment": "Enterprise",
    "country": "USA"
  }
]
```

### Update Customer

```
PUT /api/customers/{id}
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "segment": "Premium",
  "country": "USA"
}
```

**Response (200)**:
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "segment": "Premium",
  "country": "USA"
}
```

### Delete Customer

```
DELETE /api/customers/{id}
```

**Response (204)**: No content

## Sales Service Endpoints

### Create Sales Transaction

```
POST /api/sales
Content-Type: application/json

{
  "customerId": 1,
  "productId": 1,
  "transactionDate": "2024-01-15",
  "quantity": 2
}
```

**Response (201)**:
```json
{
  "id": 1,
  "customerId": 1,
  "productId": 1,
  "transactionDate": "2024-01-15",
  "quantity": 2,
  "totalAmount": 2400.00
}
```

### Get Sales Transaction

```
GET /api/sales/{id}
```

**Response (200)**:
```json
{
  "id": 1,
  "customerId": 1,
  "productId": 1,
  "transactionDate": "2024-01-15",
  "quantity": 2,
  "totalAmount": 2400.00
}
```

### List Sales Transactions

```
GET /api/sales?dateFrom=2024-01-01&dateTo=2024-01-31&customerId=1&productId=1
```

**Query Parameters**:
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)
- `customerId` (optional): Filter by customer ID
- `productId` (optional): Filter by product ID

**Response (200)**:
```json
[
  {
    "id": 1,
    "customerId": 1,
    "productId": 1,
    "transactionDate": "2024-01-15",
    "quantity": 2,
    "totalAmount": 2400.00
  }
]
```

## Analytics Service Endpoints

### Create Business Metric

```
POST /api/analytics/metrics
Content-Type: application/json

{
  "month": 1,
  "year": 2024,
  "totalSales": 50000.00,
  "totalCosts": 30000.00,
  "totalExpenses": 10000.00
}
```

**Response (201)**:
```json
{
  "id": 1,
  "month": 1,
  "year": 2024,
  "totalSales": 50000.00,
  "totalCosts": 30000.00,
  "totalExpenses": 10000.00,
  "profit": 10000.00
}
```

### List Business Metrics

```
GET /api/analytics/metrics?dateFrom=2024-01-01&dateTo=2024-12-31
```

**Query Parameters**:
- `dateFrom` (optional): Start date (YYYY-MM-DD)
- `dateTo` (optional): End date (YYYY-MM-DD)

**Response (200)**:
```json
[
  {
    "id": 1,
    "month": 1,
    "year": 2024,
    "totalSales": 50000.00,
    "totalCosts": 30000.00,
    "totalExpenses": 10000.00,
    "profit": 10000.00
  }
]
```

### Get Dashboard Summary

```
GET /api/analytics/dashboard
```

**Response (200)**:
```json
{
  "totalSales": 600000.00,
  "totalCosts": 360000.00,
  "totalProfit": 120000.00,
  "bestMonth": {
    "month": 12,
    "year": 2024,
    "profit": 15000.00
  },
  "worstMonth": {
    "month": 6,
    "year": 2024,
    "profit": 5000.00
  },
  "topProducts": [
    {
      "id": 1,
      "name": "Laptop",
      "category": "Electronics",
      "totalRevenue": 120000.00
    }
  ]
}
```

### Aggregate Sales Data

```
POST /api/analytics/aggregate
```

**Response (200)**:
```json
{
  "message": "Aggregation completed successfully"
}
```

## Document Service Endpoints

### Upload Document

```
POST /api/documents/upload
Content-Type: multipart/form-data

file: <binary file data>
```

**Supported Formats**: TXT, DOCX, PDF, XLSX

**Response (201)**:
```json
{
  "id": 1,
  "filename": "business_plan.pdf",
  "uploadDate": "2024-01-15T10:30:00Z",
  "fileSize": 102400,
  "fileType": "PDF",
  "extractionStatus": "PENDING"
}
```

### Get Document

```
GET /api/documents/{id}
```

**Response (200)**:
```json
{
  "id": 1,
  "filename": "business_plan.pdf",
  "uploadDate": "2024-01-15T10:30:00Z",
  "fileSize": 102400,
  "fileType": "PDF",
  "extractionStatus": "SUCCESS",
  "extractedText": "..."
}
```

### List Documents

```
GET /api/documents
```

**Response (200)**:
```json
[
  {
    "id": 1,
    "filename": "business_plan.pdf",
    "uploadDate": "2024-01-15T10:30:00Z",
    "fileSize": 102400,
    "fileType": "PDF",
    "extractionStatus": "SUCCESS"
  }
]
```

### Get Document Content

```
GET /api/documents/{id}/content
```

**Response (200)**:
```json
{
  "content": "Extracted text from document..."
}
```

### Delete Document

```
DELETE /api/documents/{id}
```

**Response (204)**: No content

## AI Service Endpoints

### Generate Sales Forecast

```
POST /api/ai/forecast/sales
```

**Response (200)**:
```json
{
  "predictions": [
    {
      "month": "2024-02",
      "value": 52000.00
    },
    {
      "month": "2024-03",
      "value": 54000.00
    }
  ],
  "mape": 15.5
}
```

### Generate Cost Forecast

```
POST /api/ai/forecast/costs
```

**Response (200)**:
```json
{
  "predictions": [
    {
      "month": "2024-02",
      "value": 31200.00
    },
    {
      "month": "2024-03",
      "value": 32400.00
    }
  ],
  "mape": 12.3
}
```

### Generate Profit Forecast

```
POST /api/ai/forecast/profit
```

**Response (200)**:
```json
{
  "predictions": [
    {
      "month": "2024-02",
      "value": 20800.00
    },
    {
      "month": "2024-03",
      "value": 21600.00
    }
  ],
  "mape": 18.2
}
```

### Process Chatbot Query

```
POST /api/ai/chatbot/query
Content-Type: application/json

{
  "question": "What were the total sales in January 2024?"
}
```

**Response (200)**:
```json
{
  "question": "What were the total sales in January 2024?",
  "answer": "The total sales in January 2024 were $50,000.00.",
  "sources": ["database:business_metrics"],
  "processingTime": 1.2
}
```

### Train Models

```
POST /api/ai/train
```

**Response (200)**:
```json
{
  "message": "Model training started"
}
```

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Request successful, no content to return |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., duplicate email) |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Rate Limiting

Currently, no rate limiting is implemented. This should be added in production.

## Authentication

Currently, no authentication is required. This should be added in production using JWT tokens.

## CORS

CORS is configured to allow requests from the frontend (http://localhost:5173).

## Pagination

Currently, no pagination is implemented. All list endpoints return all results. Pagination should be added for large datasets.

## Filtering

Filtering is supported on:
- Sales transactions (by date range, customer, product)
- Business metrics (by date range)

## Sorting

Currently, no sorting is implemented. Results are returned in database order.

## Versioning

API versioning is not currently implemented. All endpoints use v1 implicitly.
