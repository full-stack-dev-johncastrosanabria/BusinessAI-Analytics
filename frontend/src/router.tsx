import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import { PageLoader } from './components/PageLoader'

// Lazy-loaded page components — each becomes a separate JS chunk
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Forecasts = lazy(() => import('./pages/Forecasts'))
const Chatbot = lazy(() => import('./pages/Chatbot'))
const Documents = lazy(() => import('./pages/Documents'))
const Products = lazy(() => import('./pages/Products'))
const Customers = lazy(() => import('./pages/Customers'))
const Sales = lazy(() => import('./pages/Sales'))
const SalesTable = lazy(() => import('./pages/SalesTable'))
const SalesInfinite = lazy(() => import('./pages/SalesInfinite'))

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<Login />),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: withSuspense(<Dashboard />),
      },
      {
        path: 'forecasts',
        element: withSuspense(<Forecasts />),
      },
      {
        path: 'chatbot',
        element: withSuspense(<Chatbot />),
      },
      {
        path: 'documents',
        element: withSuspense(<Documents />),
      },
      {
        path: 'products',
        element: withSuspense(<Products />),
      },
      {
        path: 'customers',
        element: withSuspense(<Customers />),
      },
      {
        path: 'sales',
        element: withSuspense(<Sales />),
      },
      {
        path: 'sales-table',
        element: withSuspense(<SalesTable />),
      },
      {
        path: 'sales-infinite',
        element: withSuspense(<SalesInfinite />),
      },
    ],
  },
])
