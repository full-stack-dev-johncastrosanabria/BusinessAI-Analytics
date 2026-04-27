import { Outlet } from 'react-router-dom'
import Navigation from './components/Navigation'
import { ReactErrorBoundary } from './components/ReactErrorBoundary'
import './App.css'

function App() {
  return (
    <ReactErrorBoundary>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </ReactErrorBoundary>
  )
}

export default App
