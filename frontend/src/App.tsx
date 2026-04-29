import { Outlet, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import { ReactErrorBoundary } from './components/ReactErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import './i18n'
import './App.css'

function App() {
  const location = useLocation()

  return (
    <AuthProvider>
      <ThemeProvider>
        <ReactErrorBoundary>
          <div className="app">
            <Navigation />
            {/* key forces remount on route change, triggering the CSS enter animation */}
            <main className="main-content page-transition-enter" key={location.pathname}>
              <Outlet />
            </main>
          </div>
        </ReactErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
