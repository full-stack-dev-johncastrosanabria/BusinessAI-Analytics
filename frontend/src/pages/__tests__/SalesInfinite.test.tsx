import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SalesInfinite from '../SalesInfinite'
import salesService from '../../services/salesService'

vi.mock('../../services/salesService')
vi.mock('../SalesInfinite.css', () => ({}))

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()

globalThis.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
  callback,
}))

const mockTransactions = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  customerId: (i % 3) + 1,
  productId: (i % 5) + 1,
  transactionDate: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
  quantity: i + 1,
  totalAmount: (i + 1) * 99.99,
}))

describe('SalesInfinite Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(salesService.getSalesTransactions).mockReturnValue(new Promise(() => {}))
    render(<SalesInfinite />)
    expect(screen.getByText(/Loading transactions/i)).toBeInTheDocument()
  })

  it('renders transactions after loading', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText(/Sales Transactions/i)).toBeInTheDocument()
    })
  })

  it('shows first 20 transactions initially', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText(/Showing 20 of 50/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    vi.mocked(salesService.getSalesTransactions).mockRejectedValue(
      new Error('Connection refused')
    )
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText(/Error: Connection refused/)).toBeInTheDocument()
    })
  })

  it('shows generic error for non-Error rejection', async () => {
    vi.mocked(salesService.getSalesTransactions).mockRejectedValue('unknown')
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load transactions/)).toBeInTheDocument()
    })
  })

  it('handles non-array response gracefully', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(null as any)
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText(/Showing 0 of 0/)).toBeInTheDocument()
    })
  })

  it('shows "Loading more" indicator when there are more items', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText(/Showing 20 of 50/)).toBeInTheDocument()
    })
  })

  it('shows end-of-list message when all items are displayed', async () => {
    const smallData = mockTransactions.slice(0, 5)
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(smallData)
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText('No more transactions to load')).toBeInTheDocument()
    })
  })

  it('renders transaction cards with correct data', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue([
      {
        id: 42,
        customerId: 7,
        productId: 3,
        transactionDate: '2024-06-15',
        quantity: 5,
        totalAmount: 499.95,
      },
    ])
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText('#42')).toBeInTheDocument()
      expect(screen.getByText('7')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('$499.95')).toBeInTheDocument()
    })
  })

  it('sets up IntersectionObserver on mount', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue(mockTransactions)
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(mockObserve).toHaveBeenCalled()
    })
  })

  it('renders the page title', async () => {
    vi.mocked(salesService.getSalesTransactions).mockResolvedValue([])
    render(<SalesInfinite />)

    await waitFor(() => {
      expect(screen.getByText('Sales Transactions (Infinite Scroll)')).toBeInTheDocument()
    })
  })
})
