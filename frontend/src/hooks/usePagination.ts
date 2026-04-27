import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '../lib/api'

/**
 * Generic pagination types
 */
export interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Generic hook for paginated data with TanStack Query
 * Uses keepPreviousData to prevent loading states during page changes
 */
export function usePaginatedQuery<T>(
  queryKey: readonly unknown[],
  endpoint: string,
  params: PaginationParams,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useQuery({
    queryKey: [...queryKey, params],
    queryFn: () =>
      api.get<PaginatedResponse<T>>(endpoint, {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          ...(params.sortBy && { sortBy: params.sortBy }),
          ...(params.sortOrder && { sortOrder: params.sortOrder }),
          ...(params.search && { search: params.search }),
        },
      }),
    placeholderData: keepPreviousData, // Keep previous data while fetching new page
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook for managing pagination state
 */
export function usePaginationState(initialPageSize = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortBy, setSortBy] = useState<string>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const params: PaginationParams = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
  }

  const goToPage = (newPage: number) => setPage(newPage)
  const nextPage = () => setPage((p) => p + 1)
  const previousPage = () => setPage((p) => Math.max(1, p - 1))
  const resetPage = () => setPage(1)

  const changePageSize = (newSize: number) => {
    setPageSize(newSize)
    setPage(1) // Reset to first page when changing page size
  }

  const changeSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const changeSearch = (query: string) => {
    setSearch(query)
    setPage(1) // Reset to first page when searching
  }

  return {
    params,
    page,
    pageSize,
    sortBy,
    sortOrder,
    search,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    changePageSize,
    changeSort,
    changeSearch,
  }
}
