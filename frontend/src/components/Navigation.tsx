import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useBreakpoint } from '../hooks/useBreakpoint'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import './Navigation.css'

const NAV_ITEMS = [
  { path: '/',              labelKey: 'nav.dashboard' },
  { path: '/forecasts',     labelKey: 'nav.forecasts' },
  { path: '/chatbot',       labelKey: 'nav.chatbot' },
  { path: '/products',      labelKey: 'nav.products' },
  { path: '/customers',     labelKey: 'nav.customers' },
  { path: '/sales-infinite',labelKey: 'nav.sales' },
  { path: '/documents',     labelKey: 'nav.documents' },
] as const

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { logout, user } = useAuth()
  const { isMobile } = useBreakpoint()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleMenu = () => setMenuOpen((prev) => !prev)
  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="navigation" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        {/* Brand */}
        <div className="nav-brand">
          <Link to="/" className="nav-brand-link" onClick={closeMenu}>
            BusinessAI Analytics
          </Link>
        </div>

        {/* Desktop / Tablet nav links */}
        <ul className="nav-links" role="list">
          {NAV_ITEMS.map(({ path, labelKey }) => (
            <li key={path}>
              <Link
                to={path}
                className={`nav-link${isActive(path) ? ' active' : ''}`}
                aria-current={isActive(path) ? 'page' : undefined}
              >
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Controls (always visible) */}
        <div className="nav-controls">
          {user && !isMobile && (
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <button
                onClick={handleLogout}
                className="logout-btn"
                aria-label="Logout"
                title="Logout"
              >
                <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Hamburger — mobile only */}
          {isMobile && (
            <button
              className={`nav-hamburger${menuOpen ? ' is-open' : ''}`}
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobile && (
        <div
          id="mobile-menu"
          className={`nav-mobile-menu${menuOpen ? ' is-open' : ''}`}
          aria-hidden={!menuOpen}
        >
          <ul role="list">
            {NAV_ITEMS.map(({ path, labelKey }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`nav-mobile-link${isActive(path) ? ' active' : ''}`}
                  aria-current={isActive(path) ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {t(labelKey)}
                </Link>
              </li>
            ))}
          </ul>
          {user && (
            <div className="nav-mobile-user">
              <span className="user-name">{user.name}</span>
              <button
                onClick={() => { handleLogout(); closeMenu() }}
                className="logout-btn"
                aria-label="Logout"
              >
                <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navigation
