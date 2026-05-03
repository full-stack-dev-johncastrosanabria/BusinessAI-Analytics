import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ToastContainer from '../ToastContainer'

vi.mock('../Toast.css', () => ({}))
vi.mock('../ToastContainer.css', () => ({}))

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders without any toasts initially', () => {
    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.toast-container')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the toast container div', () => {
    const { container } = render(<ToastContainer />)
    expect(container.querySelector('.toast-container')).toBeInTheDocument()
  })
})
