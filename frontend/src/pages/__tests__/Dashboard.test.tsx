import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Dashboard from '../Dashboard'
import * as analyticsService from '../../services/analyticsService'

vi.mock('../../services/analyticsService')

const mockSummary = {
  totalSales: 100000,
  totalCosts: 60000,
  totalProfit: 40000,
  bestMonth: { month: 6, year: 2024, profit: 8000 },
  worstMonth: { month: 1, year: 2024, profit: 1000 },
  topProducts: [
    { id: 1, name: 'Laptop', category: 'Electronics', totalRevenue: 50000 },
    { id: 2, name: 'Mouse', category: 'Accessories', totalRevenue: 10000 },
  ],
}

const mockMetrics = [
  { id: 1, month: 1, year: 2024, totalSales: 10000, totalCosts: 6000, totalExpenses: 1000, profit: 3000 },
  { id: 2, month: 2, year: 2024, totalSales: 12000, totalCosts: 7000, totalExpenses: 1000, profit: 4000 },
]

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays loading state initially', () => {
    vi.mocked(analyticsService.default.getDashboardSummary).mockReturnValue(new Promise(() => {}))
    vi.mocked(analyticsService.default.getMetrics).mockReturnValue(new Promise(() => {}))

    render(<Dashboard />)

    expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument()
  })

  it('displays key metrics after loading', async () => {
    vi.mocked(analyticsService.default.getDashboardSummary).mockResolvedValue(mockSummary)
    vi.mocked(analyticsService.default.getMetrics).mockResolvedValue(mockMetrics)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total Sales')).toBeInTheDocument()
      expect(screen.getByText('Total Costs')).toBeInTheDocument()
      expect(screen.getByText('Total Profit')).toBeInTheDocument()
    })
  })

  it('displays best and worst months', async () => {
    vi.mocked(analyticsService.default.getDashboardSummary).mockResolvedValue(mockSummary)
    vi.mocked(analyticsService.default.getMetrics).mockResolvedValue(mockMetrics)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Best Month')).toBeInTheDocument()
      expect(screen.getByText('Worst Month')).toBeInTheDocument()
    })
  })

  it('displays top products chart section', async () => {
    vi.mocked(analyticsService.default.getDashboardSummary).mockResolvedValue(mockSummary)
    vi.mocked(analyticsService.default.getMetrics).mockResolvedValue(mockMetrics)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Top 5 Products by Revenue')).toBeInTheDocument()
    })
  })

  it('displays error message on load failure', async () => {
    vi.mocked(analyticsService.default.getDashboardSummary).mockRejectedValue(
      new Error('Failed to load dashboard data')
    )
    vi.mocked(analyticsService.default.getMetrics).mockRejectedValue(
      new Error('Failed to load metrics')
    )

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument()
    })
  })

  it('has date range filter inputs', async () => {
    vi.mocked(analyticsService.default.getDashboardSummary).mockResolvedValue(mockSummary)
    vi.mocked(analyticsService.default.getMetrics).mockResolvedValue(mockMetrics)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('From Date:')).toBeInTheDocument()
      expect(screen.getByText('To Date:')).toBeInTheDocument()
      expect(screen.getByText('Apply Filter')).toBeInTheDocument()
    })
  })

  it('calls fetchDashboardData when filter is applied', async () => {
    vi.mocked(analyticsService.default.getDashboardSummary).mockResolvedValue(mockSummary)
    vi.mocked(analyticsService.default.getMetrics).mockResolvedValue(mockMetrics)

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Apply Filter')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Apply Filter'))

    await waitFor(() => {
      expect(analyticsService.default.getDashboardSummary).toHaveBeenCalledTimes(2)
    })
  })
})
