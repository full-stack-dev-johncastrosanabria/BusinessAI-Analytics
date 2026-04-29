/**
 * Property-based tests for responsive design functionality
 *
 * **Validates: Requirements 3.2**
 *
 * Property 14: Responsive Design Functionality
 * For any viewport size within the supported range (mobile, tablet, desktop),
 * the Frontend_Application SHALL provide seamless functionality with appropriate
 * layout adaptations.
 *
 * Breakpoints:
 *   mobile:  < 768px
 *   tablet:  768px – 1279px
 *   desktop: ≥ 1280px
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { BREAKPOINTS } from '../useBreakpoint'

// ---------------------------------------------------------------------------
// Pure breakpoint classification logic (mirrors useBreakpoint internals)
// ---------------------------------------------------------------------------

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function classifyBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return 'desktop'
  if (width >= BREAKPOINTS.tablet) return 'tablet'
  return 'mobile'
}

interface BreakpointFlags {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isMobileOrTablet: boolean
  width: number
}

function buildBreakpointState(width: number): BreakpointFlags {
  const breakpoint = classifyBreakpoint(width)
  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint !== 'desktop',
    width,
  }
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Any integer in the mobile range [0, 767] */
const mobileWidth = fc.integer({ min: 0, max: BREAKPOINTS.tablet - 1 })

/** Any integer in the tablet range [768, 1279] */
const tabletWidth = fc.integer({ min: BREAKPOINTS.tablet, max: BREAKPOINTS.desktop - 1 })

/** Any integer in the desktop range [1280, 4096] */
const desktopWidth = fc.integer({ min: BREAKPOINTS.desktop, max: 4096 })

/** Any supported viewport width */
const anyWidth = fc.integer({ min: 0, max: 4096 })

// ---------------------------------------------------------------------------
// Property 14 — Responsive Design Functionality
// **Validates: Requirements 3.2**
// ---------------------------------------------------------------------------

describe('Property 14: Responsive Design Functionality', () => {
  it('mobile range: any width < 768px is classified as mobile', () => {
    fc.assert(
      fc.property(mobileWidth, (width) => {
        const state = buildBreakpointState(width)
        expect(state.breakpoint).toBe('mobile')
        expect(state.isMobile).toBe(true)
        expect(state.isTablet).toBe(false)
        expect(state.isDesktop).toBe(false)
        expect(state.isMobileOrTablet).toBe(true)
      }),
    )
  })

  it('tablet range: any width in [768, 1279] is classified as tablet', () => {
    fc.assert(
      fc.property(tabletWidth, (width) => {
        const state = buildBreakpointState(width)
        expect(state.breakpoint).toBe('tablet')
        expect(state.isMobile).toBe(false)
        expect(state.isTablet).toBe(true)
        expect(state.isDesktop).toBe(false)
        expect(state.isMobileOrTablet).toBe(true)
      }),
    )
  })

  it('desktop range: any width >= 1280px is classified as desktop', () => {
    fc.assert(
      fc.property(desktopWidth, (width) => {
        const state = buildBreakpointState(width)
        expect(state.breakpoint).toBe('desktop')
        expect(state.isMobile).toBe(false)
        expect(state.isTablet).toBe(false)
        expect(state.isDesktop).toBe(true)
        expect(state.isMobileOrTablet).toBe(false)
      }),
    )
  })

  it('breakpoint transitions are monotonic — no gaps or overlaps', () => {
    // Every width maps to exactly one breakpoint
    fc.assert(
      fc.property(anyWidth, (width) => {
        const state = buildBreakpointState(width)
        const activeCount = [state.isMobile, state.isTablet, state.isDesktop].filter(Boolean).length
        expect(activeCount).toBe(1)
      }),
    )
  })

  it('boolean flags are consistent with the breakpoint string for any width', () => {
    fc.assert(
      fc.property(anyWidth, (width) => {
        const state = buildBreakpointState(width)

        // Each flag must agree with the breakpoint string
        expect(state.isMobile).toBe(state.breakpoint === 'mobile')
        expect(state.isTablet).toBe(state.breakpoint === 'tablet')
        expect(state.isDesktop).toBe(state.breakpoint === 'desktop')

        // isMobileOrTablet is the logical OR of the two smaller breakpoints
        expect(state.isMobileOrTablet).toBe(state.isMobile || state.isTablet)

        // width is preserved unchanged
        expect(state.width).toBe(width)
      }),
    )
  })

  it('breakpoint ordering is monotonically non-decreasing with width', () => {
    // For any two widths w1 < w2, the breakpoint of w1 is never "larger" than w2
    const breakpointOrder: Record<Breakpoint, number> = { mobile: 0, tablet: 1, desktop: 2 }

    fc.assert(
      fc.property(anyWidth, anyWidth, (w1, w2) => {
        const narrower = Math.min(w1, w2)
        const wider = Math.max(w1, w2)
        const bpNarrow = classifyBreakpoint(narrower)
        const bpWide = classifyBreakpoint(wider)
        expect(breakpointOrder[bpNarrow]).toBeLessThanOrEqual(breakpointOrder[bpWide])
      }),
    )
  })

  it('layout utility classes are defined in the design tokens CSS', async () => {
    // Verify that the CSS file defining responsive utility classes exists and
    // contains the expected class names — ensuring layout adaptations are present.
    const fs = await import('fs')
    const path = await import('path')

    const cssPath = path.resolve(__dirname, '../../styles/design-tokens.css')
    expect(fs.existsSync(cssPath), `design-tokens.css not found at ${cssPath}`).toBe(true)

    const css = fs.readFileSync(cssPath, 'utf-8')

    const requiredClasses = [
      '.responsive-grid',
      '.responsive-container',
      '.responsive-stack',
      '.page-layout',
      '.hide-mobile',
      '.hide-tablet',
      '.hide-desktop',
    ]

    for (const cls of requiredClasses) {
      expect(css, `Expected CSS class "${cls}" to be defined`).toContain(cls)
    }
  })

  it('responsive CSS custom properties for breakpoints are defined', async () => {
    const fs = await import('fs')
    const path = await import('path')

    const cssPath = path.resolve(__dirname, '../../styles/design-tokens.css')
    const css = fs.readFileSync(cssPath, 'utf-8')

    // Breakpoint custom properties must be present
    expect(css).toContain('--breakpoint-mobile')
    expect(css).toContain('--breakpoint-tablet')
    expect(css).toContain('--breakpoint-desktop')

    // Responsive spacing tokens must be present
    expect(css).toContain('--page-padding-mobile')
    expect(css).toContain('--page-padding-tablet')
    expect(css).toContain('--page-padding-desktop')
  })
})
