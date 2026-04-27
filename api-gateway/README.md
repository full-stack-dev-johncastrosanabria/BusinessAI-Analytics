# API Gateway

Spring Cloud Gateway — single entry point for all frontend requests.

**Port**: 8080

## Routing

| Path | Service | Port |
|------|---------|------|
| `/api/products/**` | Product Service | 8081 |
| `/api/customers/**` | Customer Service | 8082 |
| `/api/sales/**` | Sales Service | 8083 |
| `/api/analytics/**` | Analytics Service | 8084 |
| `/api/documents/**` | Document Service | 8085 |
| `/api/ai/**` | AI Service | 8000 |

## Configuration

`src/main/resources/application.yml`

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: ai-service
          uri: http://localhost:8000      # AI Service on port 8000
          predicates:
            - Path=/api/ai/**
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOrigins:
              - "http://localhost:5173"
            allowedMethods: [GET, POST, PUT, DELETE, OPTIONS]
```

## CORS

- Allowed origin: `http://localhost:5173` (frontend)
- Credentials: enabled
- All headers allowed

## Timeouts & Retries

| Service | Retries | Backoff |
|---------|---------|---------|
| Microservices (8081–8085) | 3 | 50ms → 500ms |
| AI Service (8000) | 2 | 100ms → 1000ms |

- Connection timeout: 5s
- Response timeout: 30s

## Running

```bash
cd api-gateway
mvn spring-boot:run
```

## Health Check

```bash
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/gateway/routes
```

## Testing

```bash
mvn test
```

## Troubleshooting

**Gateway won't start:**
```bash
lsof -i :8080
tail -50 logs/api-gateway.log
```

**AI requests failing (502):**
- Verify AI service is running on port 8000, not 8086
- Check `application.yml` — `uri: http://localhost:8000`

**CORS errors in browser:**
```bash
curl -H "Origin: http://localhost:5173" \
     -X OPTIONS http://localhost:8080/api/products -v
```
