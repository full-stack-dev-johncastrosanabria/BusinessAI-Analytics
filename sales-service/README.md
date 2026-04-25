# Sales Service

The Sales Service is a Spring Boot microservice that manages sales transaction operations for the BusinessAI-Analytics platform.

## Overview

- **Port**: 8083
- **Technology**: Java 17, Spring Boot 3.2.0, Spring Data JPA
- **Database**: MySQL (businessai_analytics)
- **Purpose**: Manage sales transactions, validate customer and product references, calculate transaction totals

## Features

- Create sales transactions with customer and product validation
- Retrieve sales transactions by ID
- List sales transactions with filtering by date range, customer, and product
- Calculate transaction totals automatically (quantity × product price)
- Validate customer and product references before creating transactions

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+ running on localhost:3306
- Database `businessai_analytics` created and schema initialized
- Product Service running on port 8081 (for product validation)
- Customer Service running on port 8082 (for customer validation)

## Configuration

The service is configured via `src/main/resources/application.yml`:

- **Server Port**: 8083
- **Database URL**: jdbc:mysql://localhost:3306/businessai_analytics
- **Database Credentials**: root/root (change for production)

## Running the Service

```bash
# Build the project
mvn clean install

# Run the service
mvn spring-boot:run
```

The service will start on http://localhost:8083

## Health Check

Check service health at: http://localhost:8083/actuator/health

## API Endpoints

### Create Sales Transaction
- **POST** `/api/sales`
- **Request Body**: 
  ```json
  {
    "customerId": 1,
    "productId": 5,
    "transactionDate": "2024-01-15",
    "quantity": 2
  }
  ```

### Get Sales Transaction
- **GET** `/api/sales/{id}`

### List Sales Transactions
- **GET** `/api/sales?dateFrom=2024-01-01&dateTo=2024-12-31&customerId=1&productId=5`

## Testing

```bash
# Run all tests
mvn test

# Run with coverage
mvn test jacoco:report
```

## Architecture

The Sales Service follows a layered architecture:

- **Controller Layer**: REST endpoints (`SalesController`)
- **Service Layer**: Business logic (`SalesService`)
- **Repository Layer**: Data access (`SalesRepository`)
- **Entity Layer**: JPA entities (`SalesTransaction`)
- **Client Layer**: REST clients for inter-service communication (`ProductClient`, `CustomerClient`)

## Dependencies

- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- MySQL Connector
- Spring Boot Starter Validation
- Spring Boot Starter Actuator
- jqwik (property-based testing)

## Notes

- The service validates customer and product references by calling the Customer Service and Product Service respectively
- Transaction totals are calculated automatically based on product price and quantity
- All sales transactions are persisted to the `sales_transactions` table in MySQL
- The service uses Spring Data JPA for database operations
