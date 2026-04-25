# Product Service

The Product Service is a Spring Boot microservice that manages product CRUD operations for the BusinessAI-Analytics platform.

## Overview

- **Port**: 8081
- **Technology**: Java 17, Spring Boot 3.2.0, Spring Data JPA, MySQL
- **Purpose**: Manage product information including name, category, cost, and price

## Prerequisites

- Java 17 or higher
- Maven 3.9+
- MySQL 8.0+ running on localhost:3306
- Database `businessai_analytics` created and schema initialized

## Configuration

The service connects to MySQL using the following default configuration (see `application.yml`):

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/businessai_analytics
    username: root
    password: root
```

Update these values in `src/main/resources/application.yml` if your database configuration differs.

## Running the Service

### Using Maven

```bash
# From the product-service directory
mvn spring-boot:run
```

### Using Java

```bash
# Build the project
mvn clean package

# Run the JAR
java -jar target/product-service-1.0.0.jar
```

The service will start on port 8081. You can verify it's running by accessing:
- Health check: http://localhost:8081/actuator/health

## API Endpoints

The Product Service will expose the following REST endpoints (to be implemented in subsequent tasks):

- `POST /api/products` - Create a new product
- `GET /api/products/{id}` - Retrieve a product by ID
- `GET /api/products` - List all products
- `PUT /api/products/{id}` - Update a product
- `DELETE /api/products/{id}` - Delete a product

## Testing

Run the tests using Maven:

```bash
mvn test
```

## Project Structure

```
product-service/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/businessai/product/
│   │   │       └── ProductServiceApplication.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/
│           └── com/businessai/product/
│               └── ProductServiceApplicationTests.java
├── pom.xml
└── README.md
```

## Dependencies

Key dependencies include:
- Spring Boot Starter Web - REST API support
- Spring Boot Starter Data JPA - Database persistence
- MySQL Connector - MySQL database driver
- Spring Boot Starter Validation - Input validation
- Spring Boot Starter Actuator - Health checks and monitoring

## Related Services

- **API Gateway** (port 8080) - Routes requests to this service
- **Database** - MySQL database storing product data

## Requirements Satisfied

This service structure satisfies the following requirements:
- **21.1**: Independent Spring Boot microservice
- **21.4**: Own package structure
- **21.5**: Connects to MySQL database
- **21.7**: Independently deployable and runnable
