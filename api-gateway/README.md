# BusinessAI API Gateway

The API Gateway is the single entry point for all client requests in the BusinessAI-Analytics platform. It routes requests to the appropriate microservices and handles cross-cutting concerns.

## Overview

- **Port**: 8080
- **Framework**: Spring Cloud Gateway (Spring Boot 3.2.0)
- **Java Version**: 17

## Architecture

The API Gateway routes requests to five backend microservices and one AI service:

```
Frontend (5173) → API Gateway (8080) → Microservices
                                      ├─ Product Service (8081)
                                      ├─ Customer Service (8082)
                                      ├─ Sales Service (8083)
                                      ├─ Analytics Service (8084)
                                      ├─ Document Service (8085)
                                      └─ AI Service (8000)
```

## Route Configuration

| Path Pattern | Target Service | Port |
|-------------|----------------|------|
| `/api/products/**` | Product Service | 8081 |
| `/api/customers/**` | Customer Service | 8082 |
| `/api/sales/**` | Sales Service | 8083 |
| `/api/analytics/**` | Analytics Service | 8084 |
| `/api/documents/**` | Document Service | 8085 |
| `/api/ai/**` | AI Service | 8000 |

## Features

- **Request Routing**: Path-based routing to microservices
- **CORS Support**: Configured for frontend access from `http://localhost:5173`
- **Health Checks**: Actuator endpoints for monitoring
- **Logging**: Request/response logging for debugging
- **Error Handling**: Standardized error responses

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- All microservices running on their respective ports

## Building

```bash
mvn clean install
```

## Running

```bash
mvn spring-boot:run
```

The gateway will start on port 8080.

## Testing

Run the test suite:

```bash
mvn test
```

## Health Check

Once running, check the gateway health:

```bash
curl http://localhost:8080/actuator/health
```

## Configuration

Configuration is in `src/main/resources/application.yml`:

- **Server port**: 8080
- **Route definitions**: Path predicates and target URIs
- **CORS settings**: Allowed origins, methods, headers
- **Logging levels**: Gateway and web request logging

## Requirements Satisfied

- **21.3**: API Gateway runs on port 8080 and routes all frontend requests
- **21.6**: Implements request routing, load balancing, and error handling

## Next Steps

After setting up the API Gateway:
1. Configure route predicates for all microservices (Task 2.2)
2. Implement cross-cutting concerns (CORS, logging, error handling) (Task 2.3)
3. Write property tests for status code correctness (Task 2.4)
