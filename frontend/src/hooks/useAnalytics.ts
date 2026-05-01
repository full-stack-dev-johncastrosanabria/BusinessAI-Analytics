import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

// Configuration constants
const DASHBOARD_STALE_TIME_MS = 2 * 60 * 1000 // 2 minutes
const METRICS_STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

export interface DashboardSummary {
  readonly totalSales: number
  readonly totalCosts: number
  readonly totalProfit: number
  readonly bestMonth: {
    readonly month: number
    readonly year: number
    readonly profit: number
  }
  readonly worstMonth: {
    readonly month: number
    readonly year: number
    readonly profit: number
  }
  readonly topProducts: Array<{
    readonly id: number
    readonly name: string
    readonly category: string
    readonly totalRevenue: number
  }>
}

export interface BusinessMetric {
  readonly id: number
  readonly month: number
  readonly year: number
  readonly totalSales: number
  readonly totalCosts: number
  readonly totalExpenses: number
  readonly profit: number
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
