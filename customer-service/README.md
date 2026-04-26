# Customer Service

Microservicio para gestión de clientes con validación de email.

## Stack

- Java 17 · Spring Boot 3.2.0 · Spring Data JPA · MySQL 8.0
- Puerto: **8082**

## Ejecución

```bash
cd customer-service
mvn spring-boot:run
```

Health check: `http://localhost:8082/actuator/health`

## API

| Método | Ruta                    | Descripción              |
|--------|-------------------------|--------------------------|
| POST   | `/api/customers`        | Crear cliente            |
| GET    | `/api/customers`        | Listar todos             |
| GET    | `/api/customers/{id}`   | Obtener por ID           |
| PUT    | `/api/customers/{id}`   | Actualizar cliente       |
| DELETE | `/api/customers/{id}`   | Eliminar cliente         |

### Ejemplo de entidad

```json
{
  "id": 1,
  "name": "Christopher Miller",
  "email": "christopher.miller@example.com",
  "segment": "SMB",
  "country": "Australia"
}
```

## Validaciones

- `name`: requerido, no vacío
- `email`: requerido, formato válido, **único** en toda la tabla
- `segment`: requerido (Enterprise / SMB / Startup)
- `country`: requerido

## Tests

```bash
mvn test
```

55 tests — unitarios y property-based (jqwik).

## Segmentos disponibles

Enterprise · SMB · Startup

## Países en datos semilla

USA · Canada · UK · Germany · France · Japan · Australia · Brazil · India · Singapore
