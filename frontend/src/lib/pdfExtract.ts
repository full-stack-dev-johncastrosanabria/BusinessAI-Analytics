/**
 * Client-side PDF text extraction using pdfjs-dist.
 * Returns the full plain-text content of a PDF File, or an empty string on failure.
 */

// We import the legacy build which works without a worker in Vite
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

// Point the worker at the bundled worker file served from /public
// In static/GH-Pages mode this resolves relative to BASE_URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.mjs',
  import.meta.url
).toString()

/**
 * Extract all text from a PDF File object.
 * Returns concatenated page text, or '' if extraction fails.
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const pageTexts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (pageText) pageTexts.push(pageText)
    }

    return pageTexts.join('\n\n')
  } catch {
    // PDF extraction failed (encrypted, corrupt, etc.) — return empty
    return ''
  }
}
