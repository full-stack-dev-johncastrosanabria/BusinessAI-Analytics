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
    const params: Record<string, string> = {}
    if (filter?.dateFrom) params.dateFrom = filter.dateFrom
    if (filter?.dateTo) params.dateTo = filter.dateTo

    return api.get<BusinessMetric[]>('/api/analytics/metrics', { params })
  },

  // Get dashboard summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    return api.get<DashboardSummary>('/api/analytics/dashboard')
  },

  // Trigger aggregation of sales data into metrics
  aggregateSalesData: async (): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/api/analytics/aggregate')
  },
}

export default analyticsService
