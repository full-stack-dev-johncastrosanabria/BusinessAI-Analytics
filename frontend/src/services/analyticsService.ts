import { api } from '../lib/api'

export interface BusinessMetric {
  id: number
  month: number
  year: number
  totalSales: number
  totalCosts: number
  totalExpenses: number
  profit: number
}

export interface DashboardSummary {
  totalSales: number
  totalCosts: number
  totalProfit: number
  bestMonth: {
    month: number
    year: number
    profit: number
  }
  worstMonth: {
    month: number
    year: number
    profit: number
  }
  topProducts: Array<{
    id: number
    name: string
    category: string
    totalRevenue: number
  }>
}

export interface MetricsFilter {
  dateFrom?: string
  dateTo?: string
}

const analyticsService = {
  // Get business metrics with optional date range filter
  getMetrics: async (filter?: MetricsFilter): Promise<BusinessMetric[]> => {
    const params = new URLSearchParams()
    if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom)
    if (filter?.dateTo) params.append('dateTo', filter.dateTo)

    const response = await api.get('/api/analytics/metrics', { params })
  },

  // Get dashboard summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/api/analytics/dashboard')
  },

  // Trigger aggregation of sales data into metrics
  aggregateSalesData: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/analytics/aggregate')
  },
}

export default analyticsService
