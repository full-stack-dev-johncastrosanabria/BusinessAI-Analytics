import { PaginatedResponse } from '../hooks/usePagination'
import './Pagination.css'

interface PaginationProps {
  pagination: PaginatedResponse<unknown>['pagination']
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  showPageSize?: boolean
  showInfo?: boolean
}

export function Pagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showInfo = true,
}: PaginationProps) {
  const { page, pageSize, totalItems, totalPages, hasNextPage, hasPreviousPage } =
    pagination

  // Calculate page range to display
  const getPageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const range: (number | string)[] = []
    const rangeWithDots: (number | string)[] = []

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalItems)

  return (
    <div className="pagination-container">
      {showInfo && (
        <div className="pagination-info">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
      )}

      <div className="pagination-controls">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="pagination-button"
          aria-label="Previous page"
        >
          ← Previous
        </button>

        {/* Page numbers */}
        <div className="pagination-pages">
          {getPageNumbers().map((pageNum, index) =>
            pageNum === '...' ? (
              <span key={`dots-${index}`} className="pagination-dots">
                ...
              </span>
            ) : (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum as number)}
                className={`pagination-page ${
                  pageNum === page ? 'active' : ''
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={pageNum === page ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          )}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="pagination-button"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>

      {/* Page size selector */}
      {showPageSize && onPageSizeChange && (
        <div className="pagination-page-size">
          <label htmlFor="page-size">Items per page:</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="pagination-select"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
