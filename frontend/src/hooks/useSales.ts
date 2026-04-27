import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { usePaginatedQuery, PaginationParams } from './usePagination'
import { useInfinitePaginatedQuery, CursorPaginationParams } from './useInfinitePagination'

/**
 * Sales transaction types
 */
export interface SalesTransaction {
  id: number
  customerId: number
  customerName: string
  productId: number
  productName: string
  transactionDate: string
  quantity: number
  totalAmount: number
}

export interface SalesFilters {
  startDate?: string
  endDate?: string
  customerId?: number
  productId?: number
  minAmount?: number
  maxAmount?: number
}

// Query keys
export const salesKeys = {
  all: ['sales'] as const,
  lists: () => [...salesKeys.all, 'list'] as const,
  list: (params: PaginationParams & SalesFilters) =>
    [...salesKeys.lists(), params] as const,
  infinite: (params: Omit<CursorPaginationParams, 'cursor'> & SalesFilters) =>
    [...salesKeys.all, 'infinite', params] as const,
  detail: (id: number) => [...salesKeys.all, 'detail', id] as const,
}

/**
 * Hook for paginated sales transactions (offset-based)
 * Best for: Tables with page numbers, traditional pagination
 */
export function useSalesTransactions(
  params: PaginationParams,
  filters?: SalesFilters
) {
  return usePaginatedQuery<SalesTransaction>(
    salesKeys.list({ ...params, ...filters }),
    '/api/sales',
    params
  )
}

/**
 * Hook for infinite scroll sales transactions (cursor-based)
 * Best for: Mobile views, infinite scroll lists
 */
export function useInfiniteSalesTransactions(
  params: Omit<CursorPaginationParams, 'cursor'>,
  filters?: SalesFilters
) {
  return useInfinitePaginatedQuery<SalesTransaction>(
    salesKeys.infinite({ ...params, ...filters }),
    '/api/sales',
    params
  )
}

/**
 * Hook for single sales transaction detail
 */
export function useSalesTransaction(id: number) {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => api.get<SalesTransaction>(`/api/sales/${id}`),
    enabled: !!id,
  })
}

/**
 * Hook for creating a new sales transaction
 */
export function useCreateSalesTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<SalesTransaction, 'id'>) =>
      api.post<SalesTransaction>('/api/sales', data),
    onSuccess: () => {
      // Invalidate all sales lists to refetch
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() })
    },
  })
}

/**
 * Hook for updating a sales transaction
 */
export function useUpdateSalesTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SalesTransaction> }) =>
      api.put<SalesTransaction>(`/api/sales/${id}`, data),
    onSuccess: (_, variables) => {
      // Invalidate specific transaction and lists
      queryClient.invalidateQueries({ queryKey: salesKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() })
    },
  })
}

/**
 * Hook for deleting a sales transaction
 */
export function useDeleteSalesTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) =>
      api.delete(`/api/sales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() })
    },
  })
}
