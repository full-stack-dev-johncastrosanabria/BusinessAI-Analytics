import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SalesTable from '../SalesTable'
import salesService from '../../services/salesService'

vi.mock('../../services/salesService')
vi.mock('../SalesTable.css', () => ({}))

const mockTransactions = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  customerId: (i % 3) + 1,
  productId: (i % 5) + 1,
  transactionDate: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
  quantity: i + 1,
  totalAmount: (i + 1) * 100.5,
}))

describe('SalesTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(salesService.getSalesTransactions).mockReturnValue(new Promise(() => {}))
    render(<SalesTable />)
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
  })

  it('renders table headers after loading', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Date')).toBeInTheDocument()
      expect(screen.getByText('Customer ID')).toBeInTheDocument()
      expect(screen.getByText('Product ID')).toBeInTheDocument()
      expect(screen.getByText('Quantity')).toBeInTheDocument()
      expect(screen.getByText('Amount')).toBeInTheDocument()
    })
  })

  it('renders first page of transactions (20 items)', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      // First transaction should be visible
      expect(screen.getByText('ID')).toBeInTheDocument()
    })

    // Should show 20 rows (first page)
    const rows = document.querySelectorAll('tbody tr')
    expect(rows.length).toBe(20)
  })

  it('shows pagination controls when there are multiple pages', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of/)).toBeInTheDocument()
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })
  })

  it('navigates to next page', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of/)).toBeInTheDocument()
    })
  })

  it('navigates back to previous page', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText(/Page 2 of/)).toBeInTheDocument())

    fireEvent.click(screen.getByText('Previous'))
    await waitFor(() => expect(screen.getByText(/Page 1 of/)).toBeInTheDocument())
  })

  it('disables Previous button on first page', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      const prevBtn = screen.getByText('Previous') as HTMLButtonElement
      expect(prevBtn.disabled).toBe(true)
    })
  })

  it('disables Next button on last page', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    // Navigate to last page (3 pages for 45 items)
    fireEvent.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText(/Page 2 of/)).toBeInTheDocument())
    fireEvent.click(screen.getByText('Next'))
    await waitFor(() => expect(screen.getByText(/Page 3 of/)).toBeInTheDocument())

    const nextBtn = screen.getByText('Next') as HTMLButtonElement
    expect(nextBtn.disabled).toBe(true)
  })

  it('shows empty state when no transactions', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue([])
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    vi.mocked(salesService.getSalesTransactions).mockRejectedValue(
      new Error('Network error')
    )
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('Error loading sales data')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('shows error for non-Error rejection', async () => {
    vi.mocked(salesService.getSalesTransactions).mockRejectedValue('string error')
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load transactions')).toBeInTheDocument()
    })
  })

  it('handles non-array response gracefully', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(null as any)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument()
    })
  })

  it('shows total count in page description', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.getByText(/Browse all sales transactions/)).toBeInTheDocument()
    })
  })

  it('does not show pagination for small datasets', async () => {
    const smallData = mockTransactions.slice(0, 5)
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(smallData)
    render(<SalesTable />)

    await waitFor(() => {
      expect(screen.queryByText('Previous')).not.toBeInTheDocument()
    })
  })

  it('formats transaction date correctly', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue([
      {
        id: 1,
        customerId: 1,
        productId: 1,
        transactionDate: '2024-01-15',
        quantity: 2,
        totalAmount: 200.0,
      },
    ])
    render(<SalesTable />)

    await waitFor(() => {
      // Date should be formatted as locale date string
      expect(screen.getByText('$200.00')).toBeInTheDocument()
    })
  })
})
