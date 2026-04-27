import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import Dashboard from './pages/Dashboard'
import Forecasts from './pages/Forecasts'
import Chatbot from './pages/Chatbot'
import Documents from './pages/Documents'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Sales from './pages/Sales'
import SalesTable from './pages/SalesTable'
import SalesInfinite from './pages/SalesInfinite'
import ErrorBoundary from './components/ErrorBoundary'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'forecasts',
        element: <Forecasts />,
      },
      {
        path: 'chatbot',
        element: <Chatbot />,
      },
      {
        path: 'documents',
        element: <Documents />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'sales',
        element: <Sales />,
      },
      {
        path: 'sales-table',
        element: <SalesTable />,
      },
      {
        path: 'sales-infinite',
        element: <SalesInfinite />,
      },
    ],
  },
])
