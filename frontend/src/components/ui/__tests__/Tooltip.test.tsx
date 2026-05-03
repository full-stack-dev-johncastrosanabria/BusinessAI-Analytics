import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Tooltip } from '../Tooltip'

vi.mock('../Tooltip.css', () => ({}))

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders children', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('does not show tooltip initially', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip after mouseenter with delay', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByText('Hover me').closest('span')!)

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    expect(screen.getByText('Tooltip text')).toBeInTheDocument()
  })

  it('hides tooltip on mouseleave', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )

    const wrapper = screen.getByText('Hover me').closest('span')!
    fireEvent.mouseEnter(wrapper)
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.mouseLeave(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows tooltip on focus', () => {
    render(
      <Tooltip content="Focus tooltip">
        <button>Focus me</button>
      </Tooltip>
    )

    const wrapper = screen.getByText('Focus me').closest('span')!
    fireEvent.focus(wrapper)
    act(() => { vi.advanceTimersByTime(200) })

    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('hides tooltip on blur', () => {
    render(
      <Tooltip content="Focus tooltip">
        <button>Focus me</button>
      </Tooltip>
    )

    const wrapper = screen.getByText('Focus me').closest('span')!
    fireEvent.focus(wrapper)
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.blur(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('cancels show timer on mouseleave before delay', () => {
    render(
      <Tooltip content="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    )

    const wrapper = screen.getByText('Hover me').closest('span')!
    fireEvent.mouseEnter(wrapper)
    act(() => { vi.advanceTimersByTime(100) }) // before 200ms
    fireEvent.mouseLeave(wrapper)
    act(() => { vi.advanceTimersByTime(200) }) // advance past delay

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('applies position class', () => {
    render(
      <Tooltip content="Bottom tooltip" position="bottom">
        <button>Hover me</button>
      </Tooltip>
    )

    const wrapper = screen.getByText('Hover me').closest('span')!
    fireEvent.mouseEnter(wrapper)
    act(() => { vi.advanceTimersByTime(200) })

    expect(screen.getByRole('tooltip')).toHaveClass('tooltip--bottom')
  })
})
