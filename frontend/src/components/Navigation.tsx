import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>BusinessAI Analytics</h1>
        </div>
        <ul className="nav-links">
          <li>
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/forecasts"
              className={`nav-link ${isActive('/forecasts') ? 'active' : ''}`}
            >
              Forecasts
            </Link>
          </li>
          <li>
            <Link
              to="/documents"
              className={`nav-link ${isActive('/documents') ? 'active' : ''}`}
            >
              Documents
            </Link>
          </li>
          <li>
            <Link
              to="/chatbot"
              className={`nav-link ${isActive('/chatbot') ? 'active' : ''}`}
            >
              Chatbot
            </Link>
          </li>
          <li>
            <Link
              to="/products"
              className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            >
              Products
            </Link>
          </li>
          <li>
            <Link
              to="/customers"
              className={`nav-link ${isActive('/customers') ? 'active' : ''}`}
            >
              Customers
            </Link>
          </li>
          <li>
            <Link
              to="/sales"
              className={`nav-link ${isActive('/sales') ? 'active' : ''}`}
            >
              Sales
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navigation
