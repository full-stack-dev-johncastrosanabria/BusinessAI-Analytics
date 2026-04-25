import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Forecasts from './pages/Forecasts'
import Documents from './pages/Documents'
import Chatbot from './pages/Chatbot'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Sales from './pages/Sales'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/forecasts" element={<Forecasts />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/sales" element={<Sales />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
    </Router>
  )
}

export default App
