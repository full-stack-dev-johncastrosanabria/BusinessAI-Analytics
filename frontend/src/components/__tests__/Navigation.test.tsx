import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Navigation from '../Navigation'
import { renderWithProviders, setupTestEnvironmentWithStorage } from '../../test/utils'

describe('Navigation Component', () => {
  setupTestEnvironmentWithStorage();
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
