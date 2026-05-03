import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ForecastPrediction {
  readonly month: string
  readonly value: number
}

export interface ForecastResponse {
  readonly predictions: ForecastPrediction[]
  readonly mape: number | null
}

// Query keys for cache management
export const forecastKeys = {
  all: ['forecasts'] as const,
  sales: () => [...forecastKeys.all, 'sales'] as const,
  costs: () => [...forecastKeys.all, 'costs'] as const,
  profit: () => [...forecastKeys.all, 'profit'] as const,
}

/**
 * Hook to fetch sales forecast
 */
export function useSalesForecast() {
  return useQuery({
    queryKey: forecastKeys.sales(),
    queryFn: () => api.post<ForecastResponse>('/api/ai/forecast/sales'),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook to fetch cost forecast
 */
export function useCostForecast() {
  return useQuery({
    queryKey: forecastKeys.costs(),
    queryFn: () => api.post<ForecastResponse>('/api/ai/forecast/costs'),
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Hook to fetch profit forecast
 */
export function useProfitForecast() {
  return useQuery({
    queryKey: forecastKeys.profit(),
    queryFn: () => api.post<ForecastResponse>('/api/ai/forecast/profit'),
    staleTime: 1000 * 60 * 10,
  })
}

/**
 * Hook to generate sales forecast (mutation)
 */
export function useGenerateSalesForecast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<ForecastResponse>('/api/ai/forecast/sales'),
    onSuccess: (data) => {
      queryClient.setQueryData(forecastKeys.sales(), data)
    },
  })
}

/**
 * Hook to generate cost forecast (mutation)
 */
export function useGenerateCostForecast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<ForecastResponse>('/api/ai/forecast/costs'),
    onSuccess: (data) => {
      queryClient.setQueryData(forecastKeys.costs(), data)
    },
  })
}

/**
 * Hook to generate profit forecast (mutation)
 */
export function useGenerateProfitForecast() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.post<ForecastResponse>('/api/ai/forecast/profit'),
    onSuccess: (data) => {
      queryClient.setQueryData(forecastKeys.profit(), data)
    },
  })
}

/**
 * Hook to generate all forecasts at once
 */
export function useGenerateAllForecasts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const [sales, costs, profit] = await Promise.all([
        api.post<ForecastResponse>('/api/ai/forecast/sales'),
        api.post<ForecastResponse>('/api/ai/forecast/costs'),
        api.post<ForecastResponse>('/api/ai/forecast/profit'),
      ])
      return { sales, costs, profit }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(forecastKeys.sales(), data.sales)
      queryClient.setQueryData(forecastKeys.costs(), data.costs)
      queryClient.setQueryData(forecastKeys.profit(), data.profit)
    },
  })
}
