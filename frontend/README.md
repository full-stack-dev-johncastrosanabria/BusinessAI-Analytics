# Frontend

SPA React TypeScript para la plataforma BusinessAI-Analytics.

## Stack

- React 18.2 · TypeScript 5.3 · Vite 5.0 · Recharts 2.10 · Axios 1.6
- Puerto: **5173**

## Instalación y ejecución

```bash
cd frontend
npm install
npm run dev
```

Build de producción:
```bash
npm run build
```

## Tests

```bash
npm test          # Modo watch (Vitest)
npm run test:ui   # Interfaz visual de tests
```

82 tests en total.

## Páginas

| Página       | Ruta          | Descripción                                      |
|--------------|---------------|--------------------------------------------------|
| Dashboard    | `/`           | Métricas, gráficos de tendencias, top productos  |
| Forecasts    | `/forecasts`  | Pronósticos de ventas, costos y ganancias        |
| Documents    | `/documents`  | Subida y búsqueda de documentos                  |
| Chatbot      | `/chatbot`    | Asistente empresarial bilingüe                   |
| Products     | `/products`   | CRUD de productos                                |
| Customers    | `/customers`  | CRUD de clientes                                 |
| Sales        | `/sales`      | Registro y consulta de transacciones             |

## Estructura

```
frontend/src/
├── pages/        # Componentes de página
├── components/   # Navigation, ErrorBoundary, Toast
├── services/     # Módulos de API por servicio
└── test/         # Setup y utilidades de tests
```

## Conexión al backend

Todas las peticiones van al API Gateway en `http://localhost:8080`. Para cambiar la URL base, editar `src/services/api.ts`.
