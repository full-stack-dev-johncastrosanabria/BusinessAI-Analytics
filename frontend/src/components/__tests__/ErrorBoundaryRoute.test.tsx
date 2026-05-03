import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useRouteError: vi.fn(),
  isRouteErrorResponse: vi.fn(),
}))

import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

describe('ErrorBoundary (route error)', () => {
  it('renders error message for Error instance', () => {
    vi.mocked(useRouteError).mockReturnValue(new Error('Something broke'))
    vi.mocked(isRouteErrorResponse).mockReturnValue(false)

    render(<ErrorBoundary />)
    expect(screen.getByText('Something broke')).toBeInTheDocument()
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
  })

  it('renders generic message for unknown error type', () => {
    vi.mocked(useRouteError).mockReturnValue('string error')
    vi.mocked(isRouteErrorResponse).mockReturnValue(false)

    render(<ErrorBoundary />)
    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
  })

  it('renders route error response with status', () => {
    vi.mocked(useRouteError).mockReturnValue({
      status: 404,
      statusText: 'Not Found',
      data: { message: 'Page not found' },
    })
    vi.mocked(isRouteErrorResponse).mockReturnValue(true)

    render(<ErrorBoundary />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })

  it('renders route error response using statusText when no data message', () => {
    vi.mocked(useRouteError).mockReturnValue({
      status: 500,
      statusText: 'Internal Server Error',
      data: {},
    })
    vi.mocked(isRouteErrorResponse).mockReturnValue(true)

    render(<ErrorBoundary />)
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument()
  })

  it('renders Go Home button', () => {
    vi.mocked(useRouteError).mockReturnValue(new Error('Test'))
    vi.mocked(isRouteErrorResponse).mockReturnValue(false)

    render(<ErrorBoundary />)
    expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument()
  })

  it('Go Home button navigates to /', () => {
    vi.mocked(useRouteError).mockReturnValue(new Error('Test'))
    vi.mocked(isRouteErrorResponse).mockReturnValue(false)

    const originalLocation = globalThis.location
    Object.defineProperty(globalThis, 'location', {
      value: { href: '' },
      writable: true,
      configurable: true,
    })

    render(<ErrorBoundary />)
    fireEvent.click(screen.getByRole('button', { name: 'Go Home' }))
    expect(globalThis.location.href).toBe('/')

    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    })
  })
})
