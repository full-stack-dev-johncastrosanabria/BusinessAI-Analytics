import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import Toast from '../Toast'
import type { ToastMessage } from '../Toast'

vi.mock('../Toast.css', () => ({}))

const makeToast = (overrides: Partial<ToastMessage> = {}): ToastMessage => ({
  id: 'toast-1',
  message: 'Test message',
  type: 'success',
  ...overrides,
})

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the toast message', () => {
    render(<Toast toast={makeToast()} onClose={vi.fn()} />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders close button', () => {
    render(<Toast toast={makeToast()} onClose={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<Toast toast={makeToast({ id: 'abc' })} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalledWith('abc')
  })

  it('auto-closes after default duration (3000ms)', () => {
    const onClose = vi.fn()
    render(<Toast toast={makeToast({ id: 'auto-close' })} onClose={onClose} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onClose).toHaveBeenCalledWith('auto-close')
  })

  it('auto-closes after custom duration', () => {
    const onClose = vi.fn()
    render(<Toast toast={makeToast({ id: 'custom', duration: 1000 })} onClose={onClose} />)

    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(onClose).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onClose).toHaveBeenCalledWith('custom')
  })

  it('applies correct CSS class for success type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'success' })} onClose={vi.fn()} />)
    expect(container.firstChild).toHaveClass('toast-success')
  })

  it('applies correct CSS class for error type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'error' })} onClose={vi.fn()} />)
    expect(container.firstChild).toHaveClass('toast-error')
  })

  it('applies correct CSS class for warning type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'warning' })} onClose={vi.fn()} />)
    expect(container.firstChild).toHaveClass('toast-warning')
  })

  it('applies correct CSS class for info type', () => {
    const { container } = render(<Toast toast={makeToast({ type: 'info' })} onClose={vi.fn()} />)
    expect(container.firstChild).toHaveClass('toast-info')
  })
})
