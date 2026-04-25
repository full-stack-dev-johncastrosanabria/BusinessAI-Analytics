# BusinessAI Analytics Frontend

React TypeScript SPA for the BusinessAI Analytics platform.

## Setup

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

## Build

```bash
npm run build
```

## Testing

```bash
npm run test
npm run test:ui
```

## Project Structure

- `src/pages/` - Page components (Dashboard, Forecasts, Documents, Chatbot, Products, Customers, Sales)
- `src/components/` - Reusable components (Navigation, ErrorBoundary, Toast)
- `src/services/` - API service modules for each backend service
- `src/test/` - Test setup and utilities

## Features

- Dashboard with metrics and charts
- Sales, cost, and profit forecasting
- Document upload and management
- Chatbot interface
- Product, customer, and sales transaction management
- Error handling and user feedback
- Responsive design
