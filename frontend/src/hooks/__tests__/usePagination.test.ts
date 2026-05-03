import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePaginationState } from '../usePagination'

describe('usePaginationState', () => {
  it('initializes with default page size 10', () => {
    const { result } = renderHook(() => usePaginationState())
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(10)
  })

  it('initializes with custom page size', () => {
    const { result } = renderHook(() => usePaginationState(25))
    expect(result.current.pageSize).toBe(25)
  })

  it('goToPage sets page to given value', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.goToPage(5))
    expect(result.current.page).toBe(5)
  })

  it('nextPage increments page', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.nextPage())
    expect(result.current.page).toBe(2)
  })

  it('previousPage decrements page', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.goToPage(3))
    act(() => result.current.previousPage())
    expect(result.current.page).toBe(2)
  })

  it('previousPage does not go below 1', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.previousPage())
    expect(result.current.page).toBe(1)
  })

  it('resetPage resets to page 1', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.goToPage(7))
    act(() => result.current.resetPage())
    expect(result.current.page).toBe(1)
  })

  it('changePageSize updates pageSize and resets to page 1', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.goToPage(3))
    act(() => result.current.changePageSize(20))
    expect(result.current.pageSize).toBe(20)
    expect(result.current.page).toBe(1)
  })

  it('changeSort sets sortBy and sortOrder asc for new field', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.changeSort('name'))
    expect(result.current.sortBy).toBe('name')
    expect(result.current.sortOrder).toBe('asc')
  })

  it('changeSort toggles sortOrder for same field', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.changeSort('name'))
    act(() => result.current.changeSort('name'))
    expect(result.current.sortOrder).toBe('desc')
  })

  it('changeSort toggles back to asc', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.changeSort('name'))
    act(() => result.current.changeSort('name'))
    act(() => result.current.changeSort('name'))
    expect(result.current.sortOrder).toBe('asc')
  })

  it('changeSearch updates search and resets to page 1', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.goToPage(3))
    act(() => result.current.changeSearch('test query'))
    expect(result.current.search).toBe('test query')
    expect(result.current.page).toBe(1)
  })

  it('params object reflects current state', () => {
    const { result } = renderHook(() => usePaginationState())
    act(() => result.current.goToPage(2))
    act(() => result.current.changeSort('date'))
    act(() => result.current.changeSearch('hello'))
    // changeSearch resets page to 1
    expect(result.current.params).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: 'date',
      sortOrder: 'asc',
      search: 'hello',
    })
  })

  it('initializes with empty search', () => {
    const { result } = renderHook(() => usePaginationState())
    expect(result.current.search).toBe('')
  })

  it('initializes with undefined sortBy', () => {
    const { result } = renderHook(() => usePaginationState())
    expect(result.current.sortBy).toBeUndefined()
  })
})
