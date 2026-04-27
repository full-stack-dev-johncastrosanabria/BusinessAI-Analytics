import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

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

export interface BusinessMetric {
  id: number
  month: number
  year: number
  totalSales: number
  totalCosts: number
  totalExpenses: number
  profit: number
}

// Query keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  summary: () => [...analyticsKeys.all, 'summary'] as const,
  metrics: (filters?: { dateFrom?: string; dateTo?: string }) =>
    [...analyticsKeys.all, 'metrics', filters] as const,
}

/**
 * Hook to fetch dashboard summary
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: () => api.get<DashboardSummary>('/api/analytics/dashboard'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to fetch business metrics with optional date filtering
 */
export function useBusinessMetrics(filters?: {
  dateFrom?: string
  dateTo?: string
}) {
  return useQuery({
    queryKey: analyticsKeys.metrics(filters),
    queryFn: () =>
      api.get<BusinessMetric[]>('/api/analytics/metrics', {
        params: filters as Record<string, string | undefined>,
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
