# Sales Service

Microservicio para registro y consulta de transacciones de ventas. Valida clientes y productos llamando a sus respectivos servicios.

## Stack

- Java 17 · Spring Boot 3.2.0 · Spring Data JPA · MySQL 8.0
- Puerto: **8083**
- Depende de: Product Service (8081), Customer Service (8082)

## Ejecución

```bash
cd sales-service
mvn spring-boot:run
```

Health check: `http://localhost:8083/actuator/health`

## API

| Método | Ruta              | Descripción                                    |
|--------|-------------------|------------------------------------------------|
| POST   | `/api/sales`      | Crear transacción (valida cliente y producto)  |
| GET    | `/api/sales`      | Listar transacciones (con filtros opcionales)  |
| GET    | `/api/sales/{id}` | Obtener transacción por ID                     |

### Crear transacción

```json
POST /api/sales
{
  "customerId": 1,
  "productId": 5,
  "transactionDate": "2024-03-15",
  "quantity": 2
}
```

El `totalAmount` se calcula automáticamente: `quantity × product.price`

### Filtros disponibles

```
GET /api/sales?dateFrom=2024-01-01&dateTo=2024-12-31&customerId=1&productId=5
```

## Comunicación entre servicios

El servicio usa `RestTemplate` con timeouts configurados:
- Conexión: 5 s
- Lectura: 10 s

Si Product Service o Customer Service no están disponibles, retorna error descriptivo en lugar de fallar silenciosamente.

## Tests

```bash
mvn test
```

78 tests — unitarios, property-based (jqwik) e integración con clientes REST mockeados.
