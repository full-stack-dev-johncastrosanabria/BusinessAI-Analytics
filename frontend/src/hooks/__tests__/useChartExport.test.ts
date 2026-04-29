import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useChartExport } from '../useChartExport'

// Helper to call the hook directly (no React rendering needed — pure logic)
function callExport(data: Record<string, unknown>[], filename?: string) {
  return useChartExport({ data, filename })
}

describe('useChartExport', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>
  let appendChildSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLSpy = vi.fn(() => 'blob:mock-url')
    revokeObjectURLSpy = vi.fn()
    clickSpy = vi.fn()
    appendChildSpy = vi.fn()

    URL.createObjectURL = createObjectURLSpy
    URL.revokeObjectURL = revokeObjectURLSpy

    // Intercept anchor creation
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement
      }
      return document.createElement(tag)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exportCSV triggers a download', () => {
    const data = [{ month: '2024-01', sales: 1000 }]
    const { exportCSV } = callExport(data, 'test')
    exportCSV()
    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce()
  })

  it('exportJSON triggers a download', () => {
    const data = [{ month: '2024-01', sales: 1000 }]
    const { exportJSON } = callExport(data, 'test')
    exportJSON()
    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURLSpy).toHaveBeenCalledOnce()
  })

  it('exportCSV creates a Blob with CSV content type', () => {
    const data = [{ a: '1', b: '2' }]
    const blobSpy = vi.spyOn(globalThis, 'Blob').mockImplementation(
      (parts, opts) => ({ parts, opts }) as unknown as Blob
    )
    const { exportCSV } = callExport(data)
    exportCSV()
    expect(blobSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ type: expect.stringContaining('text/csv') })
    )
    blobSpy.mockRestore()
  })

  it('exportJSON creates a Blob with JSON content type', () => {
    const data = [{ a: '1' }]
    const blobSpy = vi.spyOn(globalThis, 'Blob').mockImplementation(
      (parts, opts) => ({ parts, opts }) as unknown as Blob
    )
    const { exportJSON } = callExport(data)
    exportJSON()
    expect(blobSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ type: 'application/json' })
    )
    blobSpy.mockRestore()
  })

  it('uses default filename when none provided', () => {
    const data = [{ x: 1 }]
    const anchor = { href: '', download: '', click: clickSpy }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement)
    const { exportCSV } = callExport(data)
    exportCSV()
    expect(anchor.download).toBe('chart-data.csv')
  })

  it('uses provided filename', () => {
    const data = [{ x: 1 }]
    const anchor = { href: '', download: '', click: clickSpy }
    vi.spyOn(document, 'createElement').mockReturnValue(anchor as unknown as HTMLAnchorElement)
    const { exportCSV } = callExport(data, 'my-report')
    exportCSV()
    expect(anchor.download).toBe('my-report.csv')
  })

  it('handles empty data gracefully for CSV', () => {
    const { exportCSV } = callExport([])
    expect(() => exportCSV()).not.toThrow()
  })

  it('handles empty data gracefully for JSON', () => {
    const { exportJSON } = callExport([])
    expect(() => exportJSON()).not.toThrow()
  })
})
