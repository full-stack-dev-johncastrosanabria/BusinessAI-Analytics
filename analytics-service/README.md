# Analytics Service

The Analytics Service is a Spring Boot microservice that manages business metrics and provides dashboard analytics for the BusinessAI-Analytics platform.

## Features

- **Business Metrics Management**: Create, read, update, and delete monthly business metrics
- **Profit Calculation**: Automatically calculates profit as totalSales - totalCosts - totalExpenses
- **Date Range Filtering**: Query metrics within specific date ranges
- **Dashboard Summary**: Provides aggregated metrics including best/worst months and top products
- **Sales Aggregation**: Aggregates sales transaction data into monthly metrics

## Technology Stack

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- MySQL 8.0
- jqwik for property-based testing

## Project Structure

```
analytics-service/
├── src/
│   ├── main/
│   │   ├── java/com/businessai/analytics/
│   │   │   ├── AnalyticsServiceApplication.java
│   │   │   ├── controller/
│   │   │   │   └── AnalyticsController.java
│   │   │   ├── entity/
│   │   │   │   └── BusinessMetric.java
│   │   │   ├── repository/
│   │   │   │   └── MetricsRepository.java
│   │   │   └── service/
│   │   │       └── AnalyticsService.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       ├── java/com/businessai/analytics/
│       │   ├── controller/
│       │   │   └── AnalyticsControllerTest.java
│       │   └── service/
│       │       ├── BusinessMetricProfitCalculationProperties.java
│       │       ├── BusinessMetricDateRangeFilteringProperties.java
│       │       ├── SalesAggregationAccuracyProperties.java
│       │       ├── DashboardBestWorstMonthProperties.java
│       │       └── DashboardTopProductsRankingProperties.java
│       └── resources/
│           └── application-test.yml
├── pom.xml
└── README.md
```

## Building and Running

### Prerequisites

- Java 17 or higher
- Maven 3.8.0 or higher
- MySQL 8.0 running on localhost:3306

### Build

```bash
mvn clean package
```

### Run

```bash
mvn spring-boot:run
```

The service will start on port 8084.

### Run Tests

```bash
# Run all tests
mvn test

# Run only unit tests
mvn test -Dtest=AnalyticsControllerTest

# Run only property-based tests
mvn test -Dtest=BusinessMetricProfitCalculationProperties
```

## API Endpoints

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

### Get All Metrics
```
GET /api/analytics/metrics
```

### Get Metrics by Date Range
```
GET /api/analytics/metrics?startYear=2024&startMonth=1&endYear=2024&endMonth=12
```

### Get Metric by ID
```
GET /api/analytics/metrics/{id}
```

### Update Metric
```
PUT /api/analytics/metrics/{id}
Content-Type: application/json

{
  "totalSales": 60000.00,
  "totalCosts": 35000.00,
  "totalExpenses": 10000.00
}
```

### Delete Metric
```
DELETE /api/analytics/metrics/{id}
```

### Get Dashboard Summary
```
GET /api/analytics/dashboard?startYear=2024&startMonth=1&endYear=2024&endMonth=12
```

### Trigger Sales Aggregation
```
POST /api/analytics/aggregate
```

## Database Configuration

The service connects to MySQL using the following configuration (in application.yml):

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/businessai_analytics
    username: root
    password: root
```

## Testing

The Analytics Service includes comprehensive tests:

### Unit Tests
- `AnalyticsControllerTest`: Tests all REST endpoints with mocked service layer

### Property-Based Tests
- `BusinessMetricProfitCalculationProperties`: Validates profit calculation formula
- `BusinessMetricDateRangeFilteringProperties`: Validates date range filtering
- `SalesAggregationAccuracyProperties`: Validates sales aggregation accuracy
- `DashboardBestWorstMonthProperties`: Validates best/worst month identification
- `DashboardTopProductsRankingProperties`: Validates top products ranking

## Requirements Validation

This service implements the following requirements:

- **Requirement 4.1**: Store Business_Metric records with month, year, totalSales, totalCosts, totalExpenses, profit
- **Requirement 4.2**: Calculate profit correctly as totalSales - totalCosts - totalExpenses
- **Requirement 4.3**: Support date range filtering for metrics
- **Requirement 4.4**: Support sales aggregation from transactions to metrics
- **Requirement 5.1-5.3**: Dashboard functionality with best/worst months and top products

## Error Handling

The service returns appropriate HTTP status codes:

- `200 OK`: Successful GET request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Validation error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a JSON body with error details:

```json
{
  "error": "Validation failed",
  "message": "Month must be between 1 and 12"
}
```

## Future Enhancements

- Implement sales aggregation from sales transactions
- Add caching for frequently accessed metrics
- Implement pagination for large result sets
- Add metrics export functionality (CSV, Excel)
- Implement real-time dashboard updates with WebSocket
