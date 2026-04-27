import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReactErrorBoundary } from '../ReactErrorBoundary'

const ThrowError = () => {
  throw new Error('Test error')
}

describe('ReactErrorBoundary Component', () => {
  it('renders children when there is no error', () => {
    render(
      <ReactErrorBoundary>
        <div>Test content</div>
      </ReactErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('displays error message when error is thrown', () => {
    // Suppress console.error for this test
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ReactErrorBoundary>
        <ThrowError />
      </ReactErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('displays go home button', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ReactErrorBoundary>
        <ThrowError />
      </ReactErrorBoundary>
    )

    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })
})
