/**
 * useChartExport — provides CSV and JSON download helpers for chart data.
 */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function toCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h]
        const str = val == null ? '' : String(val)
        // Escape commas and quotes
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      })
      .join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export interface UseChartExportOptions {
  /** Data rows to export */
  data: Record<string, unknown>[]
  /** Base filename without extension */
  filename?: string
}

export function useChartExport({ data, filename = 'chart-data' }: UseChartExportOptions) {
  const exportCSV = () => {
    const csv = toCSV(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `${filename}.csv`)
  }

  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    downloadBlob(blob, `${filename}.json`)
  }

  return { exportCSV, exportJSON }
}
