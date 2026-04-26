# Database

Esquema MySQL y generador de datos sintéticos para la plataforma BusinessAI-Analytics.

## Archivos

| Archivo                  | Descripción                                      |
|--------------------------|--------------------------------------------------|
| `schema.sql`             | Esquema completo: tablas, constraints e índices  |
| `generate_seed_data.py`  | Generador de datos sintéticos realistas          |
| `test_seed_data.py`      | Tests de validación del generador                |

## Setup inicial

```bash
# 1. Crear base de datos
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS businessai;"

# 2. Cargar esquema
mysql -u root -p businessai < database/schema.sql

# 3. Instalar dependencia Python
pip3 install mysql-connector-python

# 4. Generar datos sintéticos
python3 database/generate_seed_data.py
```

## Tablas

### `products`
| Columna    | Tipo           | Descripción              |
|------------|----------------|--------------------------|
| id         | BIGINT PK      | Identificador único      |
| name       | VARCHAR(255)   | Nombre del producto      |
| category   | VARCHAR(100)   | Categoría                |
| cost       | DECIMAL(10,2)  | Costo (≥ 0)              |
| price      | DECIMAL(10,2)  | Precio de venta (≥ 0)    |

### `customers`
| Columna  | Tipo          | Descripción                    |
|----------|---------------|--------------------------------|
| id       | BIGINT PK     | Identificador único            |
| name     | VARCHAR(255)  | Nombre completo                |
| email    | VARCHAR(255)  | Email único                    |
| segment  | VARCHAR(100)  | Enterprise / SMB / Startup     |
| country  | VARCHAR(100)  | País                           |

### `sales_transactions`
| Columna          | Tipo           | Descripción                        |
|------------------|----------------|------------------------------------|
| id               | BIGINT PK      | Identificador único                |
| customer_id      | BIGINT FK      | → customers.id (RESTRICT)         |
| product_id       | BIGINT FK      | → products.id (RESTRICT)          |
| transaction_date | DATE           | Fecha de la transacción            |
| quantity         | INT            | Cantidad (> 0)                     |
| total_amount     | DECIMAL(10,2)  | Monto total (≥ 0)                  |

### `business_metrics`
| Columna        | Tipo           | Descripción                        |
|----------------|----------------|------------------------------------|
| id             | BIGINT PK      | Identificador único                |
| month          | INT            | Mes (1–12)                         |
| year           | INT            | Año (1900–9999)                    |
| total_sales    | DECIMAL(12,2)  | Ventas totales del mes             |
| total_costs    | DECIMAL(12,2)  | Costos totales del mes             |
| total_expenses | DECIMAL(12,2)  | Gastos operativos del mes          |
| profit         | DECIMAL(12,2)  | Ganancia (puede ser negativa)      |

Restricción única: `(month, year)` — un registro por mes.

### `documents`
| Columna           | Tipo          | Descripción                          |
|-------------------|---------------|--------------------------------------|
| id                | BIGINT PK     | Identificador único                  |
| filename          | VARCHAR(255)  | Nombre del archivo                   |
| upload_date       | TIMESTAMP     | Fecha de subida                      |
| file_size         | BIGINT        | Tamaño en bytes (≥ 0)                |
| file_type         | VARCHAR(10)   | TXT / DOCX / PDF / XLSX              |
| extracted_text    | MEDIUMTEXT    | Texto extraído (hasta 16 MB)         |
| extraction_status | VARCHAR(20)   | PENDING / SUCCESS / FAILED           |
| error_message     | TEXT          | Mensaje de error si falló            |

Índice FULLTEXT en `extracted_text` para búsquedas del chatbot.

## Datos sintéticos generados

| Tabla                | Registros | Características                                    |
|----------------------|-----------|----------------------------------------------------|
| products             | 30        | 5 categorías, márgenes realistas                   |
| customers            | 100       | 3 segmentos, 10 países                             |
| sales_transactions   | 5 000     | 5 años, tendencia +5% anual, estacionalidad Q4     |
| business_metrics     | 60        | 5 años, ~70–80% meses rentables                    |

## Verificar datos cargados

```sql
SELECT 'products'           AS tabla, COUNT(*) AS registros FROM products
UNION ALL
SELECT 'customers',          COUNT(*) FROM customers
UNION ALL
SELECT 'sales_transactions', COUNT(*) FROM sales_transactions
UNION ALL
SELECT 'business_metrics',   COUNT(*) FROM business_metrics;
```

## Índices de rendimiento

- `products`: category, name
- `customers`: email (único), segment, country
- `sales_transactions`: transaction_date, customer_id, product_id, índices compuestos
- `business_metrics`: (year, month) único, profit
- `documents`: file_type, extraction_status, FULLTEXT en extracted_text

## Solución de problemas

**"Access denied":** Verificar contraseña con `mysql -u root -p`

**"Unknown database":** Ejecutar el paso 1 del setup

**"Foreign key constraint fails":** Recrear la base de datos:
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS businessai; CREATE DATABASE businessai;"
mysql -u root -p businessai < database/schema.sql
```
