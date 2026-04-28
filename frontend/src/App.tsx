import { Outlet } from 'react-router-dom'
import Navigation from './components/Navigation'
import { ReactErrorBoundary } from './components/ReactErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import './i18n'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <ReactErrorBoundary>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </ReactErrorBoundary>
    </ThemeProvider>
  )
}

export default App
