import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '../ConfirmDialog'

vi.mock('../ConfirmDialog.css', () => ({}))

const defaultProps = {
  open: true,
  title: 'Confirm Action',
  message: 'Are you sure?',
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConfirmDialog', () => {
  it('renders when open=true', () => {
    render(<ConfirmDialog {...defaultProps} />)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onCancel when overlay clicked', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('presentation'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('calls onCancel when Escape key pressed', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })

  it('uses custom confirm and cancel labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Delete"
        cancelLabel="Keep"
      />
    )
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Keep')).toBeInTheDocument()
  })

  it('applies danger class when danger=true', () => {
    render(<ConfirmDialog {...defaultProps} danger={true} />)
    const confirmBtn = screen.getByText('Confirm')
    expect(confirmBtn).toHaveClass('confirm-btn--danger')
  })

  it('applies primary class when danger=false', () => {
    render(<ConfirmDialog {...defaultProps} danger={false} />)
    const confirmBtn = screen.getByText('Confirm')
    expect(confirmBtn).toHaveClass('confirm-btn--primary')
  })

  it('does not propagate click from dialog to overlay', () => {
    const onCancel = vi.fn()
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('alertdialog'))
    expect(onCancel).not.toHaveBeenCalled()
  })
})
