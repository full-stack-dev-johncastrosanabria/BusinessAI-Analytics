import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInfiniteScrollState } from '../useInfinitePagination'

describe('useInfiniteScrollState', () => {
  it('initializes with default page size 20', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    expect(result.current.pageSize).toBe(20)
  })

  it('initializes with custom page size', () => {
    const { result } = renderHook(() => useInfiniteScrollState(50))
    expect(result.current.pageSize).toBe(50)
  })

  it('initializes with empty search', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    expect(result.current.search).toBe('')
  })

  it('initializes with undefined sortBy', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    expect(result.current.sortBy).toBeUndefined()
  })

  it('initializes with asc sortOrder', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    expect(result.current.sortOrder).toBe('asc')
  })

  it('changeSort sets sortBy and sortOrder asc for new field', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    act(() => result.current.changeSort('name'))
    expect(result.current.sortBy).toBe('name')
    expect(result.current.sortOrder).toBe('asc')
  })

  it('changeSort toggles sortOrder for same field', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    act(() => result.current.changeSort('name'))
    act(() => result.current.changeSort('name'))
    expect(result.current.sortOrder).toBe('desc')
  })

  it('changeSort toggles back to asc on third call', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    act(() => result.current.changeSort('name'))
    act(() => result.current.changeSort('name'))
    act(() => result.current.changeSort('name'))
    expect(result.current.sortOrder).toBe('asc')
  })

  it('changeSort changes field and resets to asc', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    act(() => result.current.changeSort('name'))
    act(() => result.current.changeSort('date'))
    expect(result.current.sortBy).toBe('date')
    expect(result.current.sortOrder).toBe('asc')
  })

  it('changeSearch updates search', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    act(() => result.current.changeSearch('hello world'))
    expect(result.current.search).toBe('hello world')
  })

  it('changeSearch can clear search', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    act(() => result.current.changeSearch('test'))
    act(() => result.current.changeSearch(''))
    expect(result.current.search).toBe('')
  })

  it('params object reflects current state', () => {
    const { result } = renderHook(() => useInfiniteScrollState())
    act(() => result.current.changeSort('amount'))
    act(() => result.current.changeSearch('query'))
    expect(result.current.params).toMatchObject({
      pageSize: 20,
      sortBy: 'amount',
      sortOrder: 'asc',
      search: 'query',
    })
  })

  it('exports useInfinitePaginatedQuery function', async () => {
    const module = await import('../useInfinitePagination')
    expect(typeof module.useInfinitePaginatedQuery).toBe('function')
  })
})
