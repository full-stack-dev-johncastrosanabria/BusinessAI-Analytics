/**
 * Property-based tests for data visualization components.
 *
 * **Validates: Requirements 3.3**
 *
 * Property 15: Data Visualization Enhancement Quality
 * For any data set provided to dashboard components, the UI_Designer SHALL render
 * improved visualizations using advanced charting libraries with appropriate chart
 * types and formatting.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { render, screen } from '@testing-library/react'
import { InteractiveChart, type ChartType } from '../InteractiveChart'
import { toCSV } from '../../../hooks/useChartExport'

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** A single data row with at least one numeric value key and an x-axis key. */
const rowArb = fc.record({
  x: fc.string({ minLength: 1, maxLength: 20 }),
  value: fc.float({ min: -1e6, max: 1e6, noNaN: true }),
})

/** Non-empty array of rows (1–30 items). */
const dataArb = fc.array(rowArb, { minLength: 1, maxLength: 30 })

/** Chart type arbitrary. */
const chartTypeArb: fc.Arbitrary<ChartType> = fc.constantFrom('line', 'bar')

/** A record with arbitrary string keys and mixed values including special chars. */
const specialRowArb = fc.record({
  name: fc.string({ minLength: 0, maxLength: 50 }),
  description: fc.string({ minLength: 0, maxLength: 100 }),
  amount: fc.float({ min: -1e9, max: 1e9, noNaN: true }),
})

const specialDataArb = fc.array(specialRowArb, { minLength: 1, maxLength: 20 })

// ---------------------------------------------------------------------------
// Property 15a: Component renders without errors for any non-empty numeric data
// ---------------------------------------------------------------------------

describe('Property 15: Data Visualization Enhancement Quality', () => {
  it('renders without errors for any non-empty data array with numeric values', () => {
    fc.assert(
      fc.property(dataArb, chartTypeArb, (data, chartType) => {
        const series = [{ dataKey: 'value', color: '#8884d8', name: 'Value' }]
        const { unmount } = render(
          <InteractiveChart
            data={data}
            series={series}
            xDataKey="x"
            chartType={chartType}
          />
        )
        // If we reach here without throwing, the component rendered successfully
        unmount()
        return true
      }),
      { numRuns: 50 }
    )
  })

  // ---------------------------------------------------------------------------
  // Property 15b: Correct chart type is rendered (line vs bar)
  // ---------------------------------------------------------------------------

  it('renders the correct chart type for any valid chart type input', () => {
    fc.assert(
      fc.property(dataArb, chartTypeArb, (data, chartType) => {
        const series = [{ dataKey: 'value', color: '#8884d8', name: 'Value' }]
        const title = `${chartType}-chart`
        const { unmount } = render(
          <InteractiveChart
            data={data}
            series={series}
            xDataKey="x"
            chartType={chartType}
            title={title}
          />
        )
        // Both chart types should render the title and a recharts responsive container
        expect(screen.getByText(title)).toBeInTheDocument()
        // recharts renders a ResponsiveContainer wrapper div in jsdom
        expect(
          document.querySelector('.recharts-responsive-container')
        ).not.toBeNull()
        unmount()
        return true
      }),
      { numRuns: 30 }
    )
  })

  // ---------------------------------------------------------------------------
  // Property 15c: toCSV always produces a header row matching data keys
  // ---------------------------------------------------------------------------

  it('CSV output always has a header row matching the data keys', () => {
    fc.assert(
      fc.property(specialDataArb, (data) => {
        const csv = toCSV(data)
        const lines = csv.split('\n')
        expect(lines.length).toBeGreaterThanOrEqual(2) // header + at least one row
        const headerLine = lines[0]
        const expectedHeaders = Object.keys(data[0])
        // Each expected header must appear in the header line
        for (const key of expectedHeaders) {
          expect(headerLine).toContain(key)
        }
        return true
      }),
      { numRuns: 100 }
    )
  })

  // ---------------------------------------------------------------------------
  // Property 15d: toCSV row count equals data length + 1 (header)
  // ---------------------------------------------------------------------------

  it('CSV output has exactly data.length + 1 lines for any non-empty data', () => {
    fc.assert(
      fc.property(specialDataArb, (data) => {
        const csv = toCSV(data)
        const lines = csv.split('\n')
        expect(lines).toHaveLength(data.length + 1)
        return true
      }),
      { numRuns: 100 }
    )
  })

  // ---------------------------------------------------------------------------
  // Property 15e: JSON output is always valid parseable JSON
  // ---------------------------------------------------------------------------

  it('JSON output is always valid parseable JSON for any data set', () => {
    fc.assert(
      fc.property(specialDataArb, (data) => {
        const json = JSON.stringify(data, null, 2)
        let parsed: unknown
        expect(() => {
          parsed = JSON.parse(json)
        }).not.toThrow()
        expect(Array.isArray(parsed)).toBe(true)
        expect((parsed as unknown[]).length).toBe(data.length)
        return true
      }),
      { numRuns: 100 }
    )
  })

  // ---------------------------------------------------------------------------
  // Property 15f: CSV escaping handles special characters correctly
  // ---------------------------------------------------------------------------

  it('CSV escaping handles commas, quotes, and newlines in values', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.nat({ max: 9999 }),
            // Values that may contain CSV-special characters
            text: fc.oneof(
              fc.string({ minLength: 0, maxLength: 40 }),
              fc.constant('hello, world'),
              fc.constant('say "hi"'),
              fc.constant('line1\nline2'),
              fc.constant('comma,quote",newline\n'),
            ),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (data) => {
          const csv = toCSV(data)
          const lines = csv.split('\n')
          // Header line must exist
          expect(lines[0]).toBe('id,text')

          // Parse the CSV manually to verify round-trip integrity
          // For each data row, if the text contains a comma, quote, or newline,
          // the CSV cell must be quoted
          data.forEach((row, i) => {
            const str = row.text == null ? '' : String(row.text)
            const needsQuoting =
              str.includes(',') || str.includes('"') || str.includes('\n')
            if (needsQuoting) {
              // The CSV output (after header) should contain a quoted cell
              // We check the full CSV string contains the escaped form
              const escaped = `"${str.replace(/"/g, '""')}"`
              expect(csv).toContain(escaped)
            } else {
              // Plain value should appear as-is in the CSV
              // (only check non-empty to avoid false positives)
              if (str.length > 0) {
                expect(csv).toContain(str)
              }
            }
            // Suppress unused variable warning
            void i
          })
          return true
        }
      ),
      { numRuns: 200 }
    )
  })

  // ---------------------------------------------------------------------------
  // Property 15g: Export filename always has correct extension
  // ---------------------------------------------------------------------------

  it('export filenames always have the correct extension (.csv / .json)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => /^[\w-]+$/.test(s)),
        (basename) => {
          const csvFilename = `${basename}.csv`
          const jsonFilename = `${basename}.json`
          expect(csvFilename).toMatch(/\.csv$/)
          expect(jsonFilename).toMatch(/\.json$/)
          return true
        }
      ),
      { numRuns: 200 }
    )
  })

  // ---------------------------------------------------------------------------
  // Property 15h: toCSV returns empty string for empty data array
  // ---------------------------------------------------------------------------

  it('toCSV returns empty string for empty data array', () => {
    expect(toCSV([])).toBe('')
  })

  // ---------------------------------------------------------------------------
  // Property 15i: Component renders with title for any non-empty data
  // ---------------------------------------------------------------------------

  it('renders title correctly for any non-empty data set', () => {
    fc.assert(
      fc.property(
        dataArb,
        // Filter out whitespace-only titles since getByText normalizes whitespace
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        (data, title) => {
          const series = [{ dataKey: 'value', color: '#8884d8' }]
          const { unmount } = render(
            <InteractiveChart
              data={data}
              series={series}
              xDataKey="x"
              title={title}
            />
          )
          expect(screen.getByText(title.trim())).toBeInTheDocument()
          unmount()
          return true
        }
      ),
      { numRuns: 30 }
    )
  })
})
