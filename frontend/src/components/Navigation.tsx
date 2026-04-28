import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import './Navigation.css'

function Navigation() {
  const location = useLocation()
  const { t } = useTranslation()

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
              {t('nav.dashboard')}
            </Link>
          </li>
          <li>
            <Link
              to="/forecasts"
              className={`nav-link ${isActive('/forecasts') ? 'active' : ''}`}
            >
              {t('nav.forecasts')}
            </Link>
          </li>
          <li>
            <Link
              to="/chatbot"
              className={`nav-link ${isActive('/chatbot') ? 'active' : ''}`}
            >
              {t('nav.chatbot')}
            </Link>
          </li>
          <li>
            <Link
              to="/products"
              className={`nav-link ${isActive('/products') ? 'active' : ''}`}
            >
              {t('nav.products')}
            </Link>
          </li>
          <li>
            <Link
              to="/customers"
              className={`nav-link ${isActive('/customers') ? 'active' : ''}`}
            >
              {t('nav.customers')}
            </Link>
          </li>
          <li>
            <Link
              to="/sales-infinite"
              className={`nav-link ${isActive('/sales-infinite') ? 'active' : ''}`}
            >
              {t('nav.sales')}
            </Link>
          </li>
          <li>
            <Link
              to="/documents"
              className={`nav-link ${isActive('/documents') ? 'active' : ''}`}
            >
              {t('nav.documents')}
            </Link>
          </li>
        </ul>
        <div className="nav-controls">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

export default Navigation

export default Navigation
