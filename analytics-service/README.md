# Analytics Service

Microservicio que gestiona métricas de negocio mensuales y provee datos para el dashboard.

## Stack

- Java 17 · Spring Boot 3.2.0 · Spring Data JPA · MySQL 8.0
- Puerto: **8084**

## Ejecución

```bash
cd analytics-service
mvn spring-boot:run
```

## API

### Métricas

| Método | Ruta                          | Descripción                              |
|--------|-------------------------------|------------------------------------------|
| POST   | `/api/analytics/metrics`      | Crear métrica mensual                    |
| GET    | `/api/analytics/metrics`      | Listar métricas (con filtro de fechas)   |
| GET    | `/api/analytics/metrics/{id}` | Obtener métrica por ID                   |
| PUT    | `/api/analytics/metrics/{id}` | Actualizar métrica                       |
| DELETE | `/api/analytics/metrics/{id}` | Eliminar métrica                         |

**Filtro por rango de fechas:**
```
GET /api/analytics/metrics?startYear=2024&startMonth=1&endYear=2024&endMonth=12
```

### Dashboard

```
GET /api/analytics/dashboard?startYear=2024&startMonth=1&endYear=2024&endMonth=12
```

Retorna: totales agregados, mejor mes, peor mes, top 5 productos.

### Agregación

```
POST /api/analytics/aggregate
```

Agrega transacciones de ventas en métricas mensuales.

### Ejemplo de cuerpo (POST/PUT)

```json
{
  "month": 3,
  "year": 2024,
  "totalSales": 50000.00,
  "totalCosts": 30000.00,
  "totalExpenses": 10000.00
}
```

La ganancia se calcula automáticamente: `profit = totalSales - totalCosts - totalExpenses`

## Validaciones

- `month`: 1–12
- `year`: 1900–2100
- `totalSales`, `totalCosts`, `totalExpenses`: ≥ 0
- Combinación (month, year) única

## Tests

```bash
mvn test
```

32 tests — 12 unitarios (MockMvc) + 20 property-based (jqwik, 1 000 iteraciones c/u):

| Property test                                  | Valida                                    |
|------------------------------------------------|-------------------------------------------|
| `BusinessMetricProfitCalculationProperties`    | profit = sales − costs − expenses         |
| `BusinessMetricDateRangeFilteringProperties`   | Filtrado correcto por rango de fechas     |
| `SalesAggregationAccuracyProperties`           | Suma exacta de transacciones              |
| `DashboardBestWorstMonthProperties`            | Identificación correcta de mejor/peor mes |
| `DashboardTopProductsRankingProperties`        | Ranking de productos por ingresos         |
