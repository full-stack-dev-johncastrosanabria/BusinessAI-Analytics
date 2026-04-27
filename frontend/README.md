# Frontend

React 19 SPA with TanStack Query v5, React Router v7, and TypeScript.

**Port**: 5173  
**API Base**: `http://localhost:8080` (API Gateway)

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5+ | Type safety |
| TanStack Query | v5 | Data fetching & caching |
| React Router | v7 | Routing |
| Zustand | latest | Global state |
| Vite | latest | Build tool |
| Vitest | latest | Testing |

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Sales metrics, charts, top products |
| `/forecasts` | Forecasts | 12-month AI forecasts |
| `/chatbot` | Chatbot | Bilingual AI assistant |
| `/products` | Products | CRUD — product catalog |
| `/customers` | Customers | CRUD — customer management |
| `/sales` | Sales | CRUD — sales transactions |
| `/documents` | Documents | Upload & search documents |

## Project Structure

```
src/
├── lib/
│   ├── api.ts              # Fetch-based API client (base: localhost:8080)
│   └── queryClient.ts      # TanStack Query config
├── hooks/
│   ├── useChatbot.ts       # Chatbot mutations & history
│   ├── useForecasts.ts     # Forecast queries
│   ├── useAnalytics.ts     # Dashboard queries
│   ├── useSales.ts         # Sales CRUD
│   ├── usePagination.ts    # Offset pagination
│   └── useInfinitePagination.ts
├── pages/
│   ├── Dashboard.tsx
│   ├── Forecasts.tsx
│   ├── Chatbot.tsx
│   ├── Products.tsx
│   ├── Customers.tsx
│   ├── Sales.tsx
│   └── Documents.tsx
├── services/
│   └── aiService.ts        # AI service API calls
├── store/
│   └── useAppStore.ts      # Zustand global state
└── components/
    ├── Pagination.tsx
    ├── InfiniteScroll.tsx
    └── ErrorBoundary.tsx
```

## API Client

All requests go through the API Gateway at `http://localhost:8080`:

```typescript
// src/lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Usage
const data = await api.get<Product[]>('/api/products')
const result = await api.post('/api/ai/chatbot/query', { question })
```

## Chatbot Hook

```typescript
import { useChatbot } from '../hooks/useChatbot'

function Chatbot() {
  const { messages, sendMessage, isLoading } = useChatbot()

  return (
    <button onClick={() => sendMessage('¿Cuánto se facturó este mes?')}>
      Ask
    </button>
  )
}
```

## React 19 Features Used

- `useActionState` — form state management in Chatbot
- `useFormStatus` — submit button pending state
- `useOptimistic` — optimistic chat messages
- `useTransition` — non-blocking forecast generation

## Environment Variables

```bash
# .env (optional — defaults to localhost:8080)
VITE_API_URL=http://localhost:8080
```

## Testing

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # Visual UI
```

## Build

```bash
npm run build         # Production build
npm run preview       # Preview production build
```

## Troubleshooting

**Port in use:**
```bash
lsof -ti:5173 | xargs kill -9
npm run dev
```

**Dependencies broken:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**API calls failing:**
- Ensure API Gateway is running on port 8080
- Check browser console for CORS errors
- Verify `VITE_API_URL` if using custom port
