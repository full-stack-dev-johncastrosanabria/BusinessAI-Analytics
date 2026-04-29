import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import { AuthProvider } from '../../contexts/AuthContext'
import { ThemeProvider } from '../../contexts/ThemeContext'
import Navigation from '../Navigation'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>{ui}</BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  )

describe('Navigation Component', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });
  it('renders navigation links', () => {
    renderWithProviders(<Navigation />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Forecasts')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Chatbot')).toBeInTheDocument()
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
  })

  it('renders application title', () => {
    renderWithProviders(<Navigation />)

    expect(screen.getByText('BusinessAI Analytics')).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    renderWithProviders(<Navigation />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    expect(dashboardLink).toHaveAttribute('href', '/')

    const forecastsLink = screen.getByText('Forecasts').closest('a')
    expect(forecastsLink).toHaveAttribute('href', '/forecasts')
  })
})
