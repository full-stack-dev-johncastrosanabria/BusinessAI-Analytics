# API Gateway

Punto de entrada único para todas las peticiones del frontend. Enruta hacia los microservicios y gestiona CORS, reintentos y timeouts.

## Stack

- Java 17 · Spring Cloud Gateway 2023.0.0 · Spring Boot 3.2.0
- Puerto: **8080**

## Ejecución

```bash
cd api-gateway
mvn spring-boot:run
```

Health check: `curl http://localhost:8080/actuator/health`

## Rutas configuradas

| Path                  | Servicio destino   | Puerto |
|-----------------------|--------------------|--------|
| `/api/products/**`    | Product Service    | 8081   |
| `/api/customers/**`   | Customer Service   | 8082   |
| `/api/sales/**`       | Sales Service      | 8083   |
| `/api/analytics/**`   | Analytics Service  | 8084   |
| `/api/documents/**`   | Document Service   | 8085   |
| `/api/ai/**`          | AI Service         | 8000   |

## Configuración relevante

**CORS:**
- Origen permitido: `http://localhost:5173`
- Métodos: GET, POST, PUT, DELETE, OPTIONS
- Credenciales: habilitadas

**Timeouts:**
- Conexión: 5 s
- Respuesta: 30 s (acomoda inferencia de modelos IA)

**Reintentos (microservicios 8081–8085):**
- 3 intentos con backoff exponencial (50 ms → 500 ms)

**Reintentos (AI Service 8000):**
- 2 intentos con backoff exponencial (100 ms → 1 000 ms)

## Tests

```bash
mvn test
```

69 tests — cubre predicados de ruta, códigos de estado y manejo de errores.

## Verificar rutas activas

```bash
curl http://localhost:8080/actuator/gateway/routes
```
