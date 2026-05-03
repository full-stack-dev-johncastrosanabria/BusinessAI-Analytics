import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

/**
 * Cursor-based pagination types for infinite scroll
 */
export interface CursorPaginationParams {
  readonly pageSize: number
  readonly cursor?: string | null
  readonly sortBy?: string
  readonly sortOrder?: 'asc' | 'desc'
  readonly search?: string
}

export interface CursorPaginatedResponse<T> {
  readonly data: T[]
  readonly nextCursor: string | null
  readonly hasMore: boolean
  readonly totalItems?: number
}

/**
 * Hook for infinite scroll pagination using cursor-based pagination
 * Perfect for feeds, lists, and infinite scroll UIs
 */
export function useInfinitePaginatedQuery<T>(
  queryKey: readonly unknown[],
  endpoint: string,
  params: Omit<CursorPaginationParams, 'cursor'>,
  options?: {
    enabled?: boolean
    staleTime?: number
  }
) {
  return useInfiniteQuery({
    queryKey: [...queryKey, params],
    queryFn: ({ pageParam }) =>
      api.get<CursorPaginatedResponse<T>>(endpoint, {
        params: {
          pageSize: params.pageSize,
          ...(pageParam && { cursor: pageParam }),
          ...(params.sortBy && { sortBy: params.sortBy }),
          ...(params.sortOrder && { sortOrder: params.sortOrder }),
          ...(params.search && { search: params.search }),
        },
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    staleTime: options?.staleTime ?? 1000 * 60 * 5,
    enabled: options?.enabled ?? true,
  })
}

/**
 * Hook for managing infinite scroll state
 */
export function useInfiniteScrollState(initialPageSize = 20) {
  const [pageSize] = useState(initialPageSize)
  const [sortBy, setSortBy] = useState<string>()
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [search, setSearch] = useState('')

  const params: Omit<CursorPaginationParams, 'cursor'> = {
    pageSize,
    sortBy,
    sortOrder,
    search,
  }

  const changeSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const changeSearch = (query: string) => {
    setSearch(query)
  }

  return {
    params,
    pageSize,
    sortBy,
    sortOrder,
    search,
    changeSort,
    changeSearch,
  }
}
