/**
 * useBreakpoint — Responsive design hook
 *
 * Breakpoints:
 *   mobile:  < 768px
 *   tablet:  768px – 1279px
 *   desktop: ≥ 1280px
 */

import { useState, useEffect, useCallback } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export interface BreakpointState {
  /** Current active breakpoint */
  breakpoint: Breakpoint
  /** True when viewport width < 768px */
  isMobile: boolean
  /** True when 768px ≤ viewport width < 1280px */
  isTablet: boolean
  /** True when viewport width ≥ 1280px */
  isDesktop: boolean
  /** True when viewport width < 1280px (mobile OR tablet) */
  isMobileOrTablet: boolean
  /** Current viewport width in pixels */
  width: number
}

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1280,
} as const

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return 'desktop'
  if (width >= BREAKPOINTS.tablet) return 'tablet'
  return 'mobile'
}

function buildState(width: number): BreakpointState {
  const breakpoint = getBreakpoint(width)
  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint !== 'desktop',
    width,
  }
}

/**
 * Returns the current breakpoint and convenience boolean flags.
 * Updates reactively on window resize.
 */
export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() =>
    buildState(typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.desktop),
  )

  const handleResize = useCallback(() => {
    setState(buildState(window.innerWidth))
  }, [])

  useEffect(() => {
    // Use ResizeObserver on the document element for accuracy
    if (typeof window === 'undefined') return

    // Initial sync in case the window size changed between render and effect
    setState(buildState(window.innerWidth))

    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  return state
}

/**
 * Returns true when the viewport matches the given media query string.
 * Useful for one-off checks without the full breakpoint state.
 *
 * @example
 *   const isWide = useMediaQuery('(min-width: 1280px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export { BREAKPOINTS }
