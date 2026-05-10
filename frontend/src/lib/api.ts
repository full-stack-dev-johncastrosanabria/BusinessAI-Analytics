/**
 * Modern API client using native fetch.
 * In GitHub Pages builds, selected endpoints are served from static JSON files
 * and browser-local storage because there is no backend process.
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080'
const STATIC_DATA_MODE = import.meta.env?.VITE_STATIC_DATA === 'true'
const STATIC_DATA_BASE_URL = `${import.meta.env.BASE_URL || '/'}data/`
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1_000
const CLIENT_ERROR_MIN = 400
const CLIENT_ERROR_MAX = 500
const STATIC_DOCUMENTS_KEY = 'businessai.static.documents'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
    public context?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface RequestConfig extends RequestInit {
  readonly params?: Record<string, string | number | boolean>
  readonly timeout?: number
  readonly retries?: number
}

interface StaticDocument {
  readonly id: number
  readonly filename: string
  readonly uploadDate: string
  readonly fileSize: number
  readonly fileType: string
  readonly extractedText?: string
  readonly extractionStatus: 'PENDING' | 'SUCCESS' | 'FAILED'
  readonly errorMessage?: string
  readonly local?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStaticDataFile(endpoint: string): string | null {
  const endpointPath = endpoint.split('?')[0]
  const staticEndpoints: Record<string, string> = {
    '/api/products': 'products.json',
    '/api/customers': 'customers.json',
    '/api/sales': 'sales-transactions.json',
    '/api/analytics/metrics': 'business-metrics.json',
    '/api/analytics/dashboard': 'dashboard.json',
    '/api/documents': 'documents.json',
  }

  return staticEndpoints[endpointPath] || null
}

async function fetchStaticJson<T>(file: string, fallback?: T): Promise<T> {
  const response = await fetch(`${STATIC_DATA_BASE_URL}${file}`)
  if (!response.ok) {
    if (fallback !== undefined) {
      return fallback
    }
    throw new APIError(`Static data not found: ${file}`, response.status)
  }

  return await response.json() as T
}

function applyStaticFilters<T>(endpoint: string, data: T, params?: Record<string, string | number | boolean>): T {
  if (!params || !Array.isArray(data)) {
    return data
  }

  if (endpoint === '/api/sales') {
    return data.filter((row) => {
      if (!isRecord(row)) return true
      const transactionDate = String(row.transactionDate)
      const customerId = Number(row.customerId)
      const productId = Number(row.productId)

      return (!params.dateFrom || transactionDate >= String(params.dateFrom)) &&
        (!params.dateTo || transactionDate <= String(params.dateTo)) &&
        (!params.customerId || customerId === Number(params.customerId)) &&
        (!params.productId || productId === Number(params.productId))
    }) as T
  }

  if (endpoint === '/api/analytics/metrics') {
    return data.filter((row) => {
      if (!isRecord(row)) return true
      const metricDate = `${row.year}-${String(row.month).padStart(2, '0')}-01`

      return (!params.dateFrom || metricDate >= String(params.dateFrom)) &&
        (!params.dateTo || metricDate <= String(params.dateTo))
    }) as T
  }

  return data
}

function readStoredDocuments(): StaticDocument[] {
  try {
    const raw = globalThis.localStorage?.getItem(STATIC_DOCUMENTS_KEY)
    return raw ? JSON.parse(raw) as StaticDocument[] : []
  } catch {
    return []
  }
}

function writeStoredDocuments(documents: StaticDocument[]) {
  globalThis.localStorage?.setItem(STATIC_DOCUMENTS_KEY, JSON.stringify(documents))
}

function getDocumentType(file: File): string {
  const extension = file.name.split('.').pop()?.toUpperCase()
  return extension || file.type || 'FILE'
}

async function handleStaticDocuments<T>(
  endpoint: string,
  method: string,
  body?: BodyInit
): Promise<T> {
  const idMatch = endpoint.match(/^\/api\/documents\/(\d+)(?:\/content)?$/)
  const localDocuments = readStoredDocuments()
  const exportedDocuments = await fetchStaticJson<StaticDocument[]>('documents.json', [])
  const documents = [...exportedDocuments, ...localDocuments]

  if (endpoint === '/api/documents' && method === 'GET') {
    return documents as T
  }

  if (idMatch && method === 'GET') {
    const id = Number(idMatch[1])
    const document = documents.find((item) => item.id === id)
    if (!document) {
      throw new APIError('Document not found', 404, undefined, endpoint)
    }
    if (endpoint.endsWith('/content')) {
      return { content: document.extractedText || '' } as T
    }
    return document as T
  }

  if (endpoint === '/api/documents/upload' && method === 'POST') {
    if (!(body instanceof FormData)) {
      throw new APIError('Upload requires FormData', 400, undefined, endpoint)
    }

    const file = body.get('file')
    if (!(file instanceof File)) {
      throw new APIError('Upload requires a file', 400, undefined, endpoint)
    }

    const extractedText = file.type === 'text/plain' ? await file.text() : ''
    const now = new Date().toISOString()
    const document: StaticDocument = {
      id: Date.now(),
      filename: file.name,
      uploadDate: now,
      fileSize: file.size,
      fileType: getDocumentType(file),
      extractedText,
      extractionStatus: extractedText || file.type !== 'text/plain' ? 'SUCCESS' : 'PENDING',
      local: true,
    }
    writeStoredDocuments([document, ...localDocuments])
    return document as T
  }

  if (idMatch && method === 'DELETE') {
    const id = Number(idMatch[1])
    writeStoredDocuments(localDocuments.filter((item) => item.id !== id))
    return undefined as T
  }

  throw new APIError('This document action is unavailable in the static GitHub Pages build.', 405)
}

async function handleStaticChatbot<T>(body?: BodyInit): Promise<T> {
  const payload = typeof body === 'string' ? JSON.parse(body) as { question?: string } : {}
  const question = payload.question?.trim() || ''
  const normalized = question.toLowerCase()

  const [dashboard, products, customers, metrics] = await Promise.all([
    fetchStaticJson<Record<string, unknown>>('dashboard.json'),
    fetchStaticJson<Array<Record<string, unknown>>>('products.json', []),
    fetchStaticJson<Array<Record<string, unknown>>>('customers.json', []),
    fetchStaticJson<Array<Record<string, unknown>>>('business-metrics.json', []),
  ])

  let answer = ''
  let sources = ['dashboard.json']

  if (normalized.includes('producto') || normalized.includes('product')) {
    const topProducts = Array.isArray(dashboard.topProducts) ? dashboard.topProducts : []
    const productNames = topProducts
      .filter(isRecord)
      .slice(0, 5)
      .map((product) => `${product.name} ($${Number(product.totalRevenue).toLocaleString()})`)
      .join(', ')
    answer = `Hay ${products.length} productos en el dataset. Top productos por ingresos: ${productNames || 'sin ventas registradas'}.`
    sources = ['products.json', 'dashboard.json']
  } else if (normalized.includes('cliente') || normalized.includes('customer')) {
    const segments = customers.reduce<Record<string, number>>((acc, customer) => {
      const segment = String(customer.segment || 'Unknown')
      acc[segment] = (acc[segment] || 0) + 1
      return acc
    }, {})
    answer = `Hay ${customers.length} clientes. Distribucion por segmento: ${Object.entries(segments).map(([segment, count]) => `${segment}: ${count}`).join(', ')}.`
    sources = ['customers.json']
  } else if (normalized.includes('venta') || normalized.includes('sales') || normalized.includes('transacci')) {
    const sales = await fetchStaticJson<Array<Record<string, unknown>>>('sales-transactions.json', [])
    answer = `El dataset contiene ${sales.length.toLocaleString()} transacciones y ventas totales por $${Number(dashboard.totalSales || 0).toLocaleString()}.`
    sources = ['sales-transactions.json', 'dashboard.json']
  } else if (normalized.includes('mejor') || normalized.includes('best')) {
    const best = isRecord(dashboard.bestMonth) ? dashboard.bestMonth : {}
    answer = `El mejor mes fue ${best.year}-${String(best.month).padStart(2, '0')} con profit de $${Number(best.profit || 0).toLocaleString()}.`
  } else if (normalized.includes('peor') || normalized.includes('worst')) {
    const worst = isRecord(dashboard.worstMonth) ? dashboard.worstMonth : {}
    answer = `El peor mes fue ${worst.year}-${String(worst.month).padStart(2, '0')} con profit de $${Number(worst.profit || 0).toLocaleString()}.`
  } else {
    answer = `Resumen del dataset: ventas totales $${Number(dashboard.totalSales || 0).toLocaleString()}, costos $${Number(dashboard.totalCosts || 0).toLocaleString()}, profit $${Number(dashboard.totalProfit || 0).toLocaleString()}, ${products.length} productos, ${customers.length} clientes y ${metrics.length} meses de metricas.`
    sources = ['dashboard.json', 'business-metrics.json', 'products.json', 'customers.json']
  }

  return {
    question,
    answer,
    sources,
    processing_time: 0.01,
    processingTime: 0.01,
  } as T
}

async function handleStaticForecast<T>(endpoint: string): Promise<T> {
  const metrics = await fetchStaticJson<Array<Record<string, unknown>>>('business-metrics.json', [])
  const field = endpoint.endsWith('/costs')
    ? 'totalCosts'
    : endpoint.endsWith('/profit')
      ? 'profit'
      : 'totalSales'
  const recent = metrics.slice(-12)
  const average = recent.reduce((sum, metric) => sum + Number(metric[field] || 0), 0) / Math.max(recent.length, 1)
  const lastMetric = metrics.length > 0 ? metrics[metrics.length - 1] : undefined
  const startMonth = Number(lastMetric?.month || 1)
  const startYear = Number(lastMetric?.year || new Date().getFullYear())
  const predictions = Array.from({ length: 6 }, (_, index) => {
    const monthIndex = startMonth + index
    const month = ((monthIndex - 1) % 12) + 1
    const year = startYear + Math.floor((monthIndex - 1) / 12)
    return {
      month: `${year}-${String(month).padStart(2, '0')}`,
      value: Math.round(average * (1 + (index + 1) * 0.015) * 100) / 100,
    }
  })

  return { predictions, mape: null } as T
}

async function requestStaticData<T>(
  endpoint: string,
  method: string,
  params?: Record<string, string | number | boolean>,
  body?: BodyInit
): Promise<T> {
  if (endpoint.startsWith('/api/documents')) {
    return handleStaticDocuments<T>(endpoint, method, body)
  }

  if (endpoint === '/api/ai/chatbot/query' && method === 'POST') {
    return handleStaticChatbot<T>(body)
  }

  if (endpoint.startsWith('/api/ai/forecast/') && method === 'POST') {
    return handleStaticForecast<T>(endpoint)
  }

  if (method !== 'GET') {
    throw new APIError('This action is unavailable in the static GitHub Pages build.', 405)
  }

  const staticFile = getStaticDataFile(endpoint)
  if (!staticFile) {
    throw new APIError('This endpoint is unavailable in the static GitHub Pages build.', 405)
  }

  const data = await fetchStaticJson<T>(staticFile)
  return applyStaticFilters(endpoint, data, params)
}

function createTimeoutSignal(timeout: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId)
  }
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (error instanceof APIError && error.status >= CLIENT_ERROR_MIN && error.status < CLIENT_ERROR_MAX) {
        throw error
      }

      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Request failed after retries')
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, timeout = REQUEST_TIMEOUT_MS, retries = MAX_RETRIES, ...fetchConfig } = config
  const method = fetchConfig.method || 'GET'

  if (STATIC_DATA_MODE) {
    return requestStaticData<T>(endpoint, method, params, fetchConfig.body || undefined)
  }

  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  const headers = new Headers(fetchConfig.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (!headers.has('X-Content-Type-Options')) {
    headers.set('X-Content-Type-Options', 'nosniff')
  }
  if (!headers.has('X-Frame-Options')) {
    headers.set('X-Frame-Options', 'DENY')
  }

  return retryRequest(async () => {
    try {
      const { signal, cleanup } = createTimeoutSignal(timeout)

      try {
        const response = await fetch(url.toString(), {
          ...fetchConfig,
          headers,
          signal,
        })

        if (!response.ok) {
          let errorData: unknown = null
          try {
            errorData = await response.json()
          } catch {
            // Response is not JSON.
          }

          throw new APIError(
            isRecord(errorData) && typeof errorData.message === 'string'
              ? errorData.message
              : `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            errorData,
            endpoint
          )
        }

        if (response.status === 204) {
          return undefined as T
        }

        const contentType = response.headers.get('content-type')
        const data = contentType?.includes('application/json')
          ? await response.json()
          : await response.text()
        cleanup()
        return data as T
      } finally {
        cleanup()
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(
          `Request timeout after ${timeout}ms`,
          0,
          undefined,
          endpoint
        )
      }

      throw new APIError(
        error instanceof Error ? error.message : 'Network request failed',
        0,
        undefined,
        endpoint
      )
    }
  }, retries)
}

export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => {
    let body: BodyInit | undefined
    if (data instanceof FormData) {
      body = data
    } else if (data) {
      body = JSON.stringify(data)
    } else {
      body = undefined
    }

    return request<T>(endpoint, {
      ...config,
      method: 'POST',
      body,
      headers: data instanceof FormData
        ? removeContentType(config?.headers)
        : config?.headers,
    })
  },

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) => {
    let body: BodyInit | undefined
    if (data instanceof FormData) {
      body = data
    } else if (data) {
      body = JSON.stringify(data)
    } else {
      body = undefined
    }

    return request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body,
      headers: data instanceof FormData
        ? removeContentType(config?.headers)
        : config?.headers,
    })
  },
}

function removeContentType(headers?: HeadersInit): Headers {
  const normalizedHeaders = new Headers(headers)
  normalizedHeaders.delete('Content-Type')
  return normalizedHeaders
}
