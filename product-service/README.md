# Product Service

Microservicio para gestión del catálogo de productos.

## Stack

- Java 17 · Spring Boot 3.2.0 · Spring Data JPA · MySQL 8.0
- Puerto: **8081**

## Ejecución

```bash
cd product-service
mvn spring-boot:run
```

Health check: `http://localhost:8081/actuator/health`

## API

| Método | Ruta                   | Descripción              |
|--------|------------------------|--------------------------|
| POST   | `/api/products`        | Crear producto           |
| GET    | `/api/products`        | Listar todos             |
| GET    | `/api/products/{id}`   | Obtener por ID           |
| PUT    | `/api/products/{id}`   | Actualizar producto      |
| DELETE | `/api/products/{id}`   | Eliminar producto        |

### Ejemplo de entidad

```json
{
  "id": 1,
  "name": "Laptop Pro 15",
  "category": "Electronics",
  "cost": 800.00,
  "price": 1200.00
}
```

## Validaciones

- `name`: requerido, no vacío
- `category`: requerido
- `cost`, `price`: ≥ 0

## Tests

```bash
mvn test
```

56 tests — unitarios y property-based (jqwik).

## Categorías de productos en datos semilla

Electronics · Furniture · Clothing · Food · Books
