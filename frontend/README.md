# Frontend Documentation

## Overview

Modern React 19 SPA with TanStack Query v5, React Router v7, and Zustand state management.

**Port**: 5173  
**Status**: ✅ Fully Operational

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Pages & Features](#pages--features)
5. [Custom Hooks](#custom-hooks)
6. [Components](#components)
7. [Development Guide](#development-guide)
8. [Troubleshooting](#troubleshooting)
9. [Migration Notes](#migration-notes)

---

## Quick Start

### Installation & Running

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Running Tests

```bash
npm test          # Watch mode (Vitest)
npm run test:ui   # Visual test interface
```

---

## Architecture

### Modern Stack

- **React 19** - Latest React with new hooks (useActionState, useFormStatus, useOptimistic, useTransition)
- **TanStack Query v5** - Powerful data fetching and caching
- **React Router v7** - Modern routing with nested routes
- **Zustand** - Lightweight state management
- **React Compiler** - Automatic optimization via Babel plugin
- **Vite** - Fast build tool
- **TypeScript** - Full type safety
- **Native Fetch API** - Replaced axios with modern fetch

### Project Structure

```
frontend/src/
├── lib/
│   ├── api.ts                    # Modern fetch API client
│   └── queryClient.ts            # TanStack Query config
├── store/
│   └── useAppStore.ts            # Zustand global state
├── hooks/
│   ├── useForecasts.ts           # Forecast queries & mutations
│   ├── useAnalytics.ts           # Analytics queries
│   ├── useChatbot.ts             # Chatbot with React 19 hooks
│   ├── useSales.ts               # Sales with pagination
│   ├── usePagination.ts          # Offset pagination hook
│   └── useInfinitePagination.ts  # Infinite scroll hook
├── components/
│   ├── Pagination.tsx            # Pagination UI
│   ├── InfiniteScroll.tsx        # Infinite scroll UI
│   └── ErrorBoundary.tsx         # Error handling
├── pages/
│   ├── Dashboard.tsx             # Sales metrics & charts
│   ├── Forecasts.tsx             # AI forecasts
│   ├── Chatbot.tsx               # AI chatbot
│   ├── Products.tsx              # CRUD operations
│   ├── Customers.tsx             # CRUD operations
│   ├── Sales.tsx                 # CRUD operations
│   ├── Documents.tsx             # File management
│   ├── SalesTable.tsx            # Pagination example
│   └── SalesInfinite.tsx         # Infinite scroll example
├── App.tsx                       # Main app component
├── main.tsx                      # Entry point
└── router.tsx                    # Route configuration
```

---

## Technology Stack

### React 19 Features

#### useActionState
Form handling with server actions:
```typescript
const [state, formAction, isPending] = useActionState(submitAction, {})

<form action={formAction}>
  <input name="question" />
  <button disabled={isPending}>Submit</button>
</form>
```

#### useFormStatus
Access form submission state:
```typescript
function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>Submit</button>
}
```

#### useOptimistic
Optimistic UI updates:
```typescript
const [optimisticMessages, addOptimistic] = useOptimistic(
  messages,
  (state, newMessage) => [...state, newMessage]
)
```

#### useTransition
Non-blocking state updates:
```typescript
const [isPending, startTransition] = useTransition()

startTransition(() => {
  setData(newData)
})
```

### TanStack Query v5

Automatic data fetching with:
- Smart caching (5 min stale time)
- Request deduplication
- Background refetching
- Optimistic updates
- Built-in error handling
- DevTools integration

**Example:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['forecasts'],
  queryFn: () => api.get('/api/ai/forecast/sales')
})
```

### React Router v7

Modern routing with:
- Nested routes
- Data loading
- Error boundaries
- Type-safe navigation

### Zustand

Lightweight state management:
```typescript
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}))
```

### React Compiler

Automatic optimization:
- Auto-memoization
- Better performance
- No manual useMemo/useCallback needed

---

## Pages & Features

### Dashboard (`/`)
- Sales, costs, profit metrics
- Date range filtering
- Trend charts
- Top products ranking
- Best/worst month identification

**Technology**: TanStack Query, Recharts

### Forecasts (`/forecasts`)
- 12-month sales forecast
- 12-month cost forecast
- 12-month profit forecast
- MAPE accuracy metric
- Combined forecast chart

**Technology**: TanStack Query, useTransition, Recharts

### Chatbot (`/chatbot`)
- Bilingual (EN/ES) support
- Real-time responses
- Optimistic updates
- Processing time display
- Source citations

**Technology**: React 19 hooks (useActionState, useFormStatus, useOptimistic)

### Products (`/products`)
- List all products
- Create new product
- Edit existing product
- Delete product
- Category filtering

**Technology**: TanStack Query, React Hook Form

### Customers (`/customers`)
- List all customers
- Create new customer
- Edit existing customer
- Delete customer
- Segment filtering

**Technology**: TanStack Query, React Hook Form

### Sales (`/sales`)
- List all transactions
- Create new transaction
- Product/customer dropdowns
- Date filtering

**Technology**: TanStack Query, React Hook Form

### Documents (`/documents`)
- Upload files (TXT, DOCX, PDF, XLSX)
- List uploaded documents
- Full-text search
- Delete documents

**Technology**: TanStack Query, File API

### Sales Table (`/sales-table`)
- Offset-based pagination
- Previous/Next navigation
- Page size selector
- Total count display

**Technology**: usePagination hook, keepPreviousData

### Sales Infinite (`/sales-infinite`)
- Infinite scroll
- Automatic loading
- Intersection Observer
- Loading indicator

**Technology**: useInfinitePagination hook

---

## Custom Hooks

### useForecasts

```typescript
import { useForecasts, useGenerateSalesForecast } from '../hooks/useForecasts'

function MyComponent() {
  const { data, isLoading } = useSalesForecast()
  const generateForecast = useGenerateSalesForecast()
  
  return (
    <button onClick={() => generateForecast.mutate()}>
      Generate Forecast
    </button>
  )
}
```

### useAnalytics

```typescript
import { useDashboardSummary } from '../hooks/useAnalytics'

function Dashboard() {
  const { data: metrics } = useDashboardSummary({
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31'
  })
}
```

### useChatbot

```typescript
import { useChatbot } from '../hooks/useChatbot'

function Chatbot() {
  const { sendMessage, messages, isLoading } = useChatbot()
  
  const handleSubmit = (question: string) => {
    sendMessage.mutate({ question })
  }
}
```

### useSales

```typescript
import { useSalesTransactions } from '../hooks/useSales'

function SalesList() {
  const { data: transactions } = useSalesTransactions()
}
```

### usePagination

```typescript
import { usePagination } from '../hooks/usePagination'

function MyTable() {
  const { data, page, setPage, totalPages } = usePagination({
    queryKey: ['items'],
    queryFn: ({ page, limit }) => api.get(`/items?page=${page}&limit=${limit}`),
    pageSize: 20,
  })
}
```

### useInfinitePagination

```typescript
import { useInfinitePagination } from '../hooks/useInfinitePagination'

function MyList() {
  const { data, fetchNextPage, hasNextPage } = useInfinitePagination({
    queryKey: ['items'],
    queryFn: ({ cursor, limit }) => 
      api.get(`/items?cursor=${cursor}&limit=${limit}`),
    pageSize: 20,
  })
}
```

---

## Components

### Pagination

Reusable pagination component:

```typescript
<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
  isLoading={isLoading}
/>
```

### InfiniteScroll

Reusable infinite scroll component:

```typescript
<InfiniteScroll
  data={data}
  onLoadMore={fetchNextPage}
  hasMore={hasNextPage}
  isLoading={isFetchingNextPage}
  renderItem={(item) => <div>{item.name}</div>}
/>
```

### ErrorBoundary

Error handling component:

```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## Development Guide

### Creating a New Query Hook

```typescript
// hooks/useMyData.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: () => api.get('/my-endpoint'),
  })
}
```

### Creating a Mutation Hook

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useCreateItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data) => api.post('/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
```

### Using React 19 Hooks

```typescript
// Form with useActionState
import { useActionState } from 'react'

function MyForm() {
  const [state, formAction] = useActionState(submitAction, initialState)
  
  return (
    <form action={formAction}>
      {/* form fields */}
    </form>
  )
}

// Submit button with useFormStatus
import { useFormStatus } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>Submit</button>
}
```

### Using Zustand

```typescript
import { useAppStore } from '../store/useAppStore'

function MyComponent() {
  const user = useAppStore((state) => state.user)
  const setUser = useAppStore((state) => state.setUser)
  
  return (
    <button onClick={() => setUser({ name: 'John' })}>
      Set User
    </button>
  )
}
```

---

## Troubleshooting

### Port Already in Use

```bash
lsof -ti:5173 | xargs kill -9
npm run dev
```

### Dependencies Out of Sync

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
npm run build
```

### Clear TanStack Query Cache

Open React Query DevTools (bottom corner) and click "Clear Cache"

### Frontend Not Loading

```bash
cd frontend
npm install
npm run dev
```

---

## Migration Notes

### From Axios to Fetch

The API client was migrated from axios to native fetch:

**Before:**
```typescript
const response = await axios.get('/api/products')
return response.data
```

**After:**
```typescript
return await api.get<Product[]>('/api/products')
```

### From useState/useEffect to TanStack Query

**Before:**
```typescript
const [data, setData] = useState(null)
useEffect(() => {
  fetchData().then(setData)
}, [])
```

**After:**
```typescript
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData
})
```

### From React 18 to React 19

New hooks available:
- `useActionState` - Form state management
- `useFormStatus` - Form submission status
- `useOptimistic` - Optimistic updates
- `useTransition` - Non-blocking updates

### From React Router v6 to v7

- Nested routes with `<Outlet />`
- Centralized route configuration
- Better data loading patterns

---

## Performance Tips

1. **Use keepPreviousData** - Prevents loading flicker
   ```typescript
   keepPreviousData: true
   ```

2. **Use staleTime** - Reduces unnecessary refetches
   ```typescript
   staleTime: 5 * 60 * 1000 // 5 minutes
   ```

3. **Use refetchOnWindowFocus** - Keep data fresh
   ```typescript
   refetchOnWindowFocus: true
   ```

4. **Use optimistic updates** - Instant feedback
   ```typescript
   onMutate: (newData) => {
     // Update UI immediately
   }
   ```

5. **Use React Compiler** - Automatic optimization
   - No manual useMemo/useCallback needed
   - Configured in vite.config.ts

---

## Testing

### Run Tests

```bash
npm test
```

### Run with UI

```bash
npm run test:ui
```

### Test Coverage

82 tests covering:
- Component rendering
- Hook functionality
- API integration
- Error handling
- User interactions

---

## Resources

- [React 19 Docs](https://react.dev)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Router v7 Docs](https://reactrouter.com)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Vite Docs](https://vitejs.dev)

---

## Status

✅ All pages loading without errors
✅ All API calls working correctly
✅ TanStack Query caching working
✅ React 19 hooks functioning
✅ Pagination and infinite scroll working
✅ Error handling in place
✅ TypeScript compilation successful
✅ Build completes without errors

**Status**: 🟢 FULLY OPERATIONAL
