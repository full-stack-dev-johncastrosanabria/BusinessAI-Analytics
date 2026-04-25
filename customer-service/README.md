# Customer Service

The Customer Service is a Spring Boot microservice that manages customer CRUD operations for the BusinessAI-Analytics platform.

## Overview

- **Port**: 8082
- **Database**: businessai_analytics (MySQL)
- **Technology**: Java 17, Spring Boot 3.2.0, Spring Data JPA

## Features

- Create, read, update, and delete customers
- Email format validation
- Unique email constraint enforcement
- RESTful API endpoints

## API Endpoints

- `POST /api/customers` - Create a new customer
- `GET /api/customers/{id}` - Retrieve customer by ID
- `GET /api/customers` - List all customers
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

## Running the Service

### Prerequisites

- Java 17
- MySQL 8.0 running on localhost:3306
- Database `businessai_analytics` created and schema applied

### Start the Service

```bash
cd customer-service
mvn spring-boot:run
```

The service will start on port 8082.

### Run Tests

```bash
mvn test
```

## Configuration

Configuration is in `src/main/resources/application.yml`:

- Server port: 8082
- Database connection: localhost:3306/businessai_analytics
- JPA settings: ddl-auto=none (schema managed externally)

## Customer Entity

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "segment": "Enterprise",
  "country": "USA",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00"
}
```

## Validation Rules

- **name**: Required, not empty
- **email**: Required, valid email format (contains @ and domain)
- **segment**: Required, not empty
- **country**: Required, not empty
- **email uniqueness**: Email must be unique across all customers
