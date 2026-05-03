import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../Pagination'

vi.mock('../Pagination.css', () => ({}))

const makePagination = (overrides = {}) => ({
  page: 1,
  pageSize: 10,
  totalItems: 100,
  totalPages: 10,
  hasNextPage: true,
  hasPreviousPage: false,
  ...overrides,
})

describe('Pagination', () => {
  it('renders showing info by default', () => {
    render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />)
    expect(screen.getByText('Showing 1 to 10 of 100 results')).toBeInTheDocument()
  })

  it('hides info when showInfo=false', () => {
    render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} showInfo={false} />)
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()
  })

  it('renders Previous and Next buttons', () => {
    render(<Pagination pagination={makePagination()} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument()
    expect(screen.getByLabelText('Next page')).toBeInTheDocument()
  })

  it('disables Previous on first page', () => {
    render(<Pagination pagination={makePagination({ hasPreviousPage: false })} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Previous page')).toBeDisabled()
  })

  it('disables Next on last page', () => {
    render(<Pagination pagination={makePagination({ hasNextPage: false })} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Next page')).toBeDisabled()
  })

  it('calls onPageChange with page-1 when Previous clicked', () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        pagination={makePagination({ page: 3, hasPreviousPage: true })}
        onPageChange={onPageChange}
      />
    )
    fireEvent.click(screen.getByLabelText('Previous page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with page+1 when Next clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination pagination={makePagination({ page: 1 })} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Next page'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange when a page number is clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination pagination={makePagination({ page: 1, totalPages: 5 })} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Page 2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('marks current page as active', () => {
    render(<Pagination pagination={makePagination({ page: 1, totalPages: 5 })} onPageChange={vi.fn()} />)
    const page1 = screen.getByLabelText('Page 1')
    expect(page1).toHaveAttribute('aria-current', 'page')
  })

  it('shows page size selector when onPageSizeChange provided', () => {
    render(
      <Pagination
        pagination={makePagination()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Items per page:')).toBeInTheDocument()
  })

  it('hides page size selector when showPageSize=false', () => {
    render(
      <Pagination
        pagination={makePagination()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        showPageSize={false}
      />
    )
    expect(screen.queryByLabelText('Items per page:')).not.toBeInTheDocument()
  })

  it('calls onPageSizeChange when page size changes', () => {
    const onPageSizeChange = vi.fn()
    render(
      <Pagination
        pagination={makePagination()}
        onPageChange={vi.fn()}
        onPageSizeChange={onPageSizeChange}
      />
    )
    fireEvent.change(screen.getByLabelText('Items per page:'), { target: { value: '20' } })
    expect(onPageSizeChange).toHaveBeenCalledWith(20)
  })

  it('renders dots for large page ranges', () => {
    render(
      <Pagination
        pagination={makePagination({ page: 5, totalPages: 20 })}
        onPageChange={vi.fn()}
      />
    )
    // Should show dots
    const dots = screen.getAllByText('...')
    expect(dots.length).toBeGreaterThan(0)
  })

  it('renders single page correctly', () => {
    render(
      <Pagination
        pagination={makePagination({ page: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false })}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByLabelText('Page 1')).toBeInTheDocument()
  })

  it('shows correct range on last page', () => {
    render(
      <Pagination
        pagination={makePagination({ page: 10, pageSize: 10, totalItems: 95, totalPages: 10, hasNextPage: false, hasPreviousPage: true })}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText('Showing 91 to 95 of 95 results')).toBeInTheDocument()
  })

  it('renders custom page size options', () => {
    render(
      <Pagination
        pagination={makePagination()}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        pageSizeOptions={[5, 15, 25]}
      />
    )
    expect(screen.getByRole('option', { name: '5' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '15' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument()
  })
})
