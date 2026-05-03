import { describe, it, expect, vi } from 'vitest'

// Mock zustand persist to avoid localStorage issues in test environment
vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware')
  return {
    ...actual,
    persist: (fn: unknown) => fn, // bypass persist middleware
    devtools: (fn: unknown) => fn, // bypass devtools middleware
  }
})

import { useAppStore } from '../useAppStore'

describe('useAppStore', () => {
  it('exports useAppStore as a function', () => {
    expect(typeof useAppStore).toBe('function')
  })

  it('has sidebarOpen state', () => {
    const state = useAppStore.getState()
    expect(typeof state.sidebarOpen).toBe('boolean')
  })

  it('has theme state', () => {
    const state = useAppStore.getState()
    expect(['light', 'dark']).toContain(state.theme)
  })

  it('has dateFormat state', () => {
    const state = useAppStore.getState()
    expect(typeof state.dateFormat).toBe('string')
  })

  it('has currency state', () => {
    const state = useAppStore.getState()
    expect(typeof state.currency).toBe('string')
  })

  it('toggleSidebar action exists', () => {
    const state = useAppStore.getState()
    expect(typeof state.toggleSidebar).toBe('function')
  })

  it('setSidebarOpen action exists', () => {
    const state = useAppStore.getState()
    expect(typeof state.setSidebarOpen).toBe('function')
  })

  it('setTheme action exists', () => {
    const state = useAppStore.getState()
    expect(typeof state.setTheme).toBe('function')
  })

  it('setDateFormat action exists', () => {
    const state = useAppStore.getState()
    expect(typeof state.setDateFormat).toBe('function')
  })

  it('setCurrency action exists', () => {
    const state = useAppStore.getState()
    expect(typeof state.setCurrency).toBe('function')
  })

  it('toggleSidebar toggles sidebarOpen', () => {
    const initial = useAppStore.getState().sidebarOpen
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(!initial)
    // Toggle back
    useAppStore.getState().toggleSidebar()
    expect(useAppStore.getState().sidebarOpen).toBe(initial)
  })

  it('setSidebarOpen sets value directly', () => {
    useAppStore.getState().setSidebarOpen(false)
    expect(useAppStore.getState().sidebarOpen).toBe(false)
    useAppStore.getState().setSidebarOpen(true)
    expect(useAppStore.getState().sidebarOpen).toBe(true)
  })

  it('setTheme updates theme to dark', () => {
    useAppStore.getState().setTheme('dark')
    expect(useAppStore.getState().theme).toBe('dark')
  })

  it('setTheme updates theme to light', () => {
    useAppStore.getState().setTheme('light')
    expect(useAppStore.getState().theme).toBe('light')
  })

  it('setDateFormat updates dateFormat', () => {
    useAppStore.getState().setDateFormat('DD/MM/YYYY')
    expect(useAppStore.getState().dateFormat).toBe('DD/MM/YYYY')
  })

  it('setCurrency updates currency', () => {
    useAppStore.getState().setCurrency('EUR')
    expect(useAppStore.getState().currency).toBe('EUR')
  })
})
