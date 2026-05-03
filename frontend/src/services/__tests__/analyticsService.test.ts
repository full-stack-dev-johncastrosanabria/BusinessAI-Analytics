import { describe, it, expect, vi, beforeEach } from 'vitest'
import analyticsService from '../analyticsService'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockMetrics = [
  {
    id: 1,
    month: 1,
    year: 2024,
    totalSales: 50000,
    totalCosts: 30000,
    totalExpenses: 5000,
    profit: 15000,
  },
  {
    id: 2,
    month: 2,
    year: 2024,
    totalSales: 60000,
    totalCosts: 35000,
    totalExpenses: 6000,
    profit: 19000,
  },
]

const mockSummary = {
  totalSales: 110000,
  totalCosts: 65000,
  totalProfit: 34000,
  bestMonth: { month: 2, year: 2024, profit: 19000 },
  worstMonth: { month: 1, year: 2024, profit: 15000 },
  topProducts: [
    { id: 1, name: 'Widget A', category: 'Electronics', totalRevenue: 25000 },
  ],
}

describe('analyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMetrics', () => {
    it('fetches metrics without filter', async () => {
      vi.mocked(api.get).mockResolvedValue(mockMetrics)
      const result = await analyticsService.getMetrics()
      expect(api.get).toHaveBeenCalledWith('/api/analytics/metrics', { params: {} })
      expect(result).toEqual(mockMetrics)
    })

    it('fetches metrics with dateFrom filter', async () => {
      vi.mocked(api.get).mockResolvedValue(mockMetrics)
      await analyticsService.getMetrics({ dateFrom: '2024-01-01' })
      expect(api.get).toHaveBeenCalledWith('/api/analytics/metrics', {
        params: { dateFrom: '2024-01-01' },
      })
    })

    it('fetches metrics with dateTo filter', async () => {
      vi.mocked(api.get).mockResolvedValue(mockMetrics)
      await analyticsService.getMetrics({ dateTo: '2024-12-31' })
      expect(api.get).toHaveBeenCalledWith('/api/analytics/metrics', {
        params: { dateTo: '2024-12-31' },
      })
    })

    it('fetches metrics with both date filters', async () => {
      vi.mocked(api.get).mockResolvedValue(mockMetrics)
      await analyticsService.getMetrics({ dateFrom: '2024-01-01', dateTo: '2024-12-31' })
      expect(api.get).toHaveBeenCalledWith('/api/analytics/metrics', {
        params: { dateFrom: '2024-01-01', dateTo: '2024-12-31' },
      })
    })

    it('fetches metrics with empty filter object', async () => {
      vi.mocked(api.get).mockResolvedValue(mockMetrics)
      await analyticsService.getMetrics({})
      expect(api.get).toHaveBeenCalledWith('/api/analytics/metrics', { params: {} })
    })

    it('propagates errors', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
      await expect(analyticsService.getMetrics()).rejects.toThrow('Network error')
    })
  })

  describe('getDashboardSummary', () => {
    it('fetches dashboard summary', async () => {
      vi.mocked(api.get).mockResolvedValue(mockSummary)
      const result = await analyticsService.getDashboardSummary()
      expect(api.get).toHaveBeenCalledWith('/api/analytics/dashboard')
      expect(result).toEqual(mockSummary)
    })

    it('propagates errors', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Server error'))
      await expect(analyticsService.getDashboardSummary()).rejects.toThrow('Server error')
    })
  })

  describe('aggregateSalesData', () => {
    it('posts to aggregate endpoint', async () => {
      vi.mocked(api.post).mockResolvedValue({ message: 'Aggregation complete' })
      const result = await analyticsService.aggregateSalesData()
      expect(api.post).toHaveBeenCalledWith('/api/analytics/aggregate')
      expect(result).toEqual({ message: 'Aggregation complete' })
    })

    it('propagates errors', async () => {
      vi.mocked(api.post).mockRejectedValue(new Error('Aggregation failed'))
      await expect(analyticsService.aggregateSalesData()).rejects.toThrow('Aggregation failed')
    })
  })
})
