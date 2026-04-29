import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// Configuration constants
const DASHBOARD_STALE_TIME_MS = 2 * 60 * 1000 // 2 minutes
const METRICS_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

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

function createMetricsParams(filters?: {
  dateFrom?: string
  dateTo?: string
}): Record<string, string> | undefined {
  if (!filters) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(filters).filter((entry): entry is [string, string] => entry[1] !== undefined)
  )
}

/**
 * Hook to fetch dashboard summary
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: analyticsKeys.summary(),
    queryFn: () => api.get<DashboardSummary>('/api/analytics/dashboard'),
    staleTime: DASHBOARD_STALE_TIME_MS,
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
        params: createMetricsParams(filters),
      }),
    staleTime: METRICS_STALE_TIME_MS,
  })
}
