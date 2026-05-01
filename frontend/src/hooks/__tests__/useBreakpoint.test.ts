/**
 * Unit tests for useBreakpoint hook
 *
 * Tests the responsive breakpoint logic:
 *   mobile:  < 768px
 *   tablet:  768px – 1279px
 *   desktop: ≥ 1280px
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBreakpoint, BREAKPOINTS } from '../useBreakpoint'

// Helper to set globalThis.innerWidth and fire resize
function setViewportWidth(width: number) {
  Object.defineProperty(globalThis, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  globalThis.dispatchEvent(new Event('resize'))
}

describe('useBreakpoint', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "mobile" for widths below 768px', () => {
    setViewportWidth(375)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(375) })
    expect(result.current.breakpoint).toBe('mobile')
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isMobileOrTablet).toBe(true)
  })

  it('returns "tablet" for widths 768px – 1279px', () => {
    setViewportWidth(768)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(768) })
    expect(result.current.breakpoint).toBe('tablet')
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.isMobileOrTablet).toBe(true)
  })

  it('returns "tablet" at 1279px (just below desktop threshold)', () => {
    setViewportWidth(1279)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(1279) })
    expect(result.current.breakpoint).toBe('tablet')
  })

  it('returns "desktop" for widths ≥ 1280px', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(1280) })
    expect(result.current.breakpoint).toBe('desktop')
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobileOrTablet).toBe(false)
  })

  it('updates breakpoint reactively on resize', () => {
    setViewportWidth(375)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(375) })
    expect(result.current.breakpoint).toBe('mobile')

    act(() => { setViewportWidth(1024) })
    expect(result.current.breakpoint).toBe('tablet')

    act(() => { setViewportWidth(1440) })
    expect(result.current.breakpoint).toBe('desktop')
  })

  it('exposes the current viewport width', () => {
    setViewportWidth(800)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(800) })
    expect(result.current.width).toBe(800)
  })

  it('BREAKPOINTS constants match expected values', () => {
    expect(BREAKPOINTS.mobile).toBe(0)
    expect(BREAKPOINTS.tablet).toBe(768)
    expect(BREAKPOINTS.desktop).toBe(1280)
  })

  it('boundary: exactly 767px is mobile', () => {
    setViewportWidth(767)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(767) })
    expect(result.current.breakpoint).toBe('mobile')
  })

  it('boundary: exactly 1280px is desktop', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useBreakpoint())
    act(() => { setViewportWidth(1280) })
    expect(result.current.breakpoint).toBe('desktop')
  })
})
