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

function getActiveLanguage(question?: string): 'en' | 'es' {
  const stored = globalThis.localStorage?.getItem('i18nextLng')
  if (stored?.startsWith('es')) return 'es'
  if (stored?.startsWith('en')) return 'en'

  const q = question?.toLowerCase() || ''
  if (/[áéíóúñ¿]/.test(q) || ['ventas', 'clientes', 'productos', 'ganancia', 'costos'].some((term) => q.includes(term))) {
    return 'es'
  }

  return 'en'
}

function formatCurrency(value: unknown, language: 'en' | 'es'): string {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function formatNumber(value: unknown, language: 'en' | 'es'): string {
  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US').format(Number(value || 0))
}

function monthName(year: unknown, month: unknown, language: 'en' | 'es'): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(Number(year), Number(month) - 1, 1))
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function parseRequestedYear(question: string): number | null {
  const match = question.match(/\b(20\d{2}|19\d{2})\b/)
  return match ? Number(match[1]) : null
}

function parseRequestedMonth(question: string): number | null {
  const monthTerms: Array<[number, string[]]> = [
    [1, ['january', 'jan', 'enero']],
    [2, ['february', 'feb', 'febrero']],
    [3, ['march', 'mar', 'marzo']],
    [4, ['april', 'apr', 'abril']],
    [5, ['may', 'mayo']],
    [6, ['june', 'jun', 'junio']],
    [7, ['july', 'jul', 'julio']],
    [8, ['august', 'aug', 'agosto']],
    [9, ['september', 'sep', 'septiembre']],
    [10, ['october', 'oct', 'octubre']],
    [11, ['november', 'nov', 'noviembre']],
    [12, ['december', 'dec', 'diciembre']],
  ]
  return monthTerms.find(([, terms]) => terms.some((term) => question.includes(term)))?.[0] || null
}

function summarizeTrend(metrics: Array<Record<string, unknown>>, field: string, language: 'en' | 'es'): string {
  const recent = metrics.slice(-6)
  if (recent.length < 2) {
    return language === 'es'
      ? 'No hay suficientes meses para calcular una tendencia.'
      : 'There are not enough months to calculate a trend.'
  }

  const first = Number(recent[0][field] || 0)
  const last = Number(recent[recent.length - 1][field] || 0)
  const change = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100
  const direction = change >= 0
    ? (language === 'es' ? 'subio' : 'increased')
    : (language === 'es' ? 'bajo' : 'decreased')

  return language === 'es'
    ? `En los ultimos 6 meses, ${field === 'profit' ? 'la ganancia' : 'las ventas'} ${direction} ${Math.abs(change).toFixed(1)}%, de ${formatCurrency(first, language)} a ${formatCurrency(last, language)}.`
    : `Over the last 6 months, ${field === 'profit' ? 'profit' : 'sales'} ${direction} ${Math.abs(change).toFixed(1)}%, from ${formatCurrency(first, language)} to ${formatCurrency(last, language)}.`
}

function getTopCustomers(
  sales: Array<Record<string, unknown>>,
  customers: Array<Record<string, unknown>>
): Array<Record<string, unknown> & { totalRevenue: number; transactions: number }> {
  const customerMap = new Map(customers.map((customer) => [Number(customer.id), customer]))
  const totals = new Map<number, { totalRevenue: number; transactions: number }>()
  sales.forEach((transaction) => {
    const customerId = Number(transaction.customerId)
    const current = totals.get(customerId) || { totalRevenue: 0, transactions: 0 }
    current.totalRevenue += Number(transaction.totalAmount || 0)
    current.transactions += 1
    totals.set(customerId, current)
  })

  return [...totals.entries()]
    .map(([customerId, totalsForCustomer]) => ({
      ...(customerMap.get(customerId) || { id: customerId, name: `Customer ${customerId}` }),
      ...totalsForCustomer,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
}

function getProductPerformance(
  sales: Array<Record<string, unknown>>,
  products: Array<Record<string, unknown>>
): Array<Record<string, unknown> & { revenue: number; units: number; estimatedProfit: number; margin: number }> {
  const productMap = new Map(products.map((product) => [Number(product.id), product]))
  const totals = new Map<number, { revenue: number; units: number }>()
  sales.forEach((transaction) => {
    const productId = Number(transaction.productId)
    const current = totals.get(productId) || { revenue: 0, units: 0 }
    current.revenue += Number(transaction.totalAmount || 0)
    current.units += Number(transaction.quantity || 0)
    totals.set(productId, current)
  })

  return [...totals.entries()]
    .map(([productId, totalsForProduct]) => {
      const product = productMap.get(productId) || { id: productId, name: `Product ${productId}` }
      const unitProfit = Number(product.price || 0) - Number(product.cost || 0)
      const estimatedProfit = unitProfit * totalsForProduct.units
      return {
        ...product,
        ...totalsForProduct,
        estimatedProfit,
        margin: totalsForProduct.revenue ? (estimatedProfit / totalsForProduct.revenue) * 100 : 0,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
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
  const language = getActiveLanguage(question)

  const [dashboard, products, customers, metrics, sales, documents] = await Promise.all([
    fetchStaticJson<Record<string, unknown>>('dashboard.json'),
    fetchStaticJson<Array<Record<string, unknown>>>('products.json', []),
    fetchStaticJson<Array<Record<string, unknown>>>('customers.json', []),
    fetchStaticJson<Array<Record<string, unknown>>>('business-metrics.json', []),
    fetchStaticJson<Array<Record<string, unknown>>>('sales-transactions.json', []),
    fetchStaticJson<Array<Record<string, unknown>>>('documents.json', []),
  ])

  let answer = ''
  let sources = ['dashboard.json']

  if (includesAny(normalized, ['document', 'archivo', 'documento', 'file'])) {
    const searchableTerms = normalized
      .split(/\W+/)
      .filter((term) => term.length > 3 && !['document', 'documents', 'documento', 'documentos', 'archivo', 'archivos', 'search', 'buscar'].includes(term))
    const matches = documents.filter((document) => {
      const haystack = `${document.filename || ''} ${document.extractedText || ''}`.toLowerCase()
      return searchableTerms.length === 0 || searchableTerms.some((term) => haystack.includes(term))
    })
    answer = language === 'es'
      ? `Hay ${documents.length} documentos exportados desde la base. ${matches.length > 0 ? `Coincidencias: ${matches.slice(0, 3).map((doc) => doc.filename).join(', ')}.` : 'No encontre coincidencias con esos terminos.'}`
      : `There are ${documents.length} documents exported from the database. ${matches.length > 0 ? `Matches: ${matches.slice(0, 3).map((doc) => doc.filename).join(', ')}.` : 'I did not find matches for those terms.'}`
    sources = ['documents.json']
  } else if (includesAny(normalized, ['forecast', 'pronostico', 'pronóstico', 'predic', 'projection', 'proyeccion'])) {
    const recent = metrics.slice(-12)
    const avgSales = recent.reduce((sum, metric) => sum + Number(metric.totalSales || 0), 0) / Math.max(recent.length, 1)
    const avgProfit = recent.reduce((sum, metric) => sum + Number(metric.profit || 0), 0) / Math.max(recent.length, 1)
    answer = language === 'es'
      ? `Pronostico estatico basado en el promedio de los ultimos 12 meses: ventas esperadas cercanas a ${formatCurrency(avgSales * 1.015, language)} y ganancia cercana a ${formatCurrency(avgProfit * 1.015, language)} para el proximo mes.`
      : `Static forecast based on the last 12-month average: expected sales near ${formatCurrency(avgSales * 1.015, language)} and profit near ${formatCurrency(avgProfit * 1.015, language)} for next month.`
    sources = ['business-metrics.json']
  } else if (includesAny(normalized, ['producto', 'product', 'item', 'categoria', 'category', 'margin', 'margen'])) {
    const productPerformance = getProductPerformance(sales, products)
    const isMarginQuery = includesAny(normalized, ['margin', 'margen', 'profit by product', 'ganancia por producto'])
    const topProducts = (isMarginQuery
      ? [...productPerformance].sort((a, b) => b.estimatedProfit - a.estimatedProfit)
      : productPerformance).slice(0, 5)
    const categories = [...new Set(products.map((product) => String(product.category)))]
    const productList = topProducts
      .map((product) => `${product.name}: ${formatCurrency(product.revenue, language)} revenue, ${product.margin.toFixed(1)}% margin`)
      .join('; ')
    answer = language === 'es'
      ? `Hay ${products.length} productos en ${categories.length} categorias (${categories.join(', ')}). Top productos: ${productList || 'sin ventas registradas'}.`
      : `There are ${products.length} products across ${categories.length} categories (${categories.join(', ')}). Top products: ${productList || 'no sales recorded'}.`
    sources = ['products.json', 'sales-transactions.json']
  } else if (includesAny(normalized, ['cliente', 'customer', 'client', 'segment', 'pais', 'country'])) {
    const topCustomers = getTopCustomers(sales, customers).slice(0, 5)
    const segments = customers.reduce<Record<string, number>>((acc, customer) => {
      const segment = String(customer.segment || 'Unknown')
      acc[segment] = (acc[segment] || 0) + 1
      return acc
    }, {})
    const customerList = topCustomers
      .map((customer) => `${customer.name}: ${formatCurrency(customer.totalRevenue, language)} (${formatNumber(customer.transactions, language)} tx)`)
      .join('; ')
    answer = language === 'es'
      ? `Hay ${customers.length} clientes. Segmentos: ${Object.entries(segments).map(([segment, count]) => `${segment}: ${count}`).join(', ')}. Top clientes por ingresos: ${customerList}.`
      : `There are ${customers.length} customers. Segments: ${Object.entries(segments).map(([segment, count]) => `${segment}: ${count}`).join(', ')}. Top customers by revenue: ${customerList}.`
    sources = ['customers.json', 'sales-transactions.json']
  } else if (includesAny(normalized, ['tendencia', 'trend', 'crecimiento', 'growth'])) {
    answer = summarizeTrend(metrics, includesAny(normalized, ['profit', 'ganancia', 'utilidad']) ? 'profit' : 'totalSales', language)
    sources = ['business-metrics.json']
  } else if (includesAny(normalized, ['mejor', 'best', 'highest', 'maximo', 'máximo', 'peak'])) {
    const best = isRecord(dashboard.bestMonth) ? dashboard.bestMonth : {}
    answer = language === 'es'
      ? `El mejor mes fue ${monthName(best.year, best.month, language)} con ganancia de ${formatCurrency(best.profit, language)}.`
      : `The best month was ${monthName(best.year, best.month, language)} with ${formatCurrency(best.profit, language)} in profit.`
    sources = ['dashboard.json', 'business-metrics.json']
  } else if (includesAny(normalized, ['peor', 'worst', 'lowest', 'minimo', 'mínimo'])) {
    const worst = isRecord(dashboard.worstMonth) ? dashboard.worstMonth : {}
    answer = language === 'es'
      ? `El peor mes fue ${monthName(worst.year, worst.month, language)} con ganancia de ${formatCurrency(worst.profit, language)}.`
      : `The worst month was ${monthName(worst.year, worst.month, language)} with ${formatCurrency(worst.profit, language)} in profit.`
    sources = ['dashboard.json', 'business-metrics.json']
  } else if (includesAny(normalized, ['profit', 'ganancia', 'utilidad', 'cost', 'costo', 'expense', 'gasto', 'rentab'])) {
    const totalSales = Number(dashboard.totalSales || 0)
    const totalProfit = Number(dashboard.totalProfit || 0)
    const margin = totalSales ? (totalProfit / totalSales) * 100 : 0
    const profitableMonths = metrics.filter((metric) => Number(metric.profit || 0) > 0).length
    answer = language === 'es'
      ? `Ganancia total: ${formatCurrency(totalProfit, language)}. Margen neto aproximado: ${margin.toFixed(1)}%. Meses rentables: ${profitableMonths} de ${metrics.length}. Costos acumulados: ${formatCurrency(dashboard.totalCosts, language)}.`
      : `Total profit: ${formatCurrency(totalProfit, language)}. Approximate net margin: ${margin.toFixed(1)}%. Profitable months: ${profitableMonths} of ${metrics.length}. Total costs: ${formatCurrency(dashboard.totalCosts, language)}.`
    sources = ['dashboard.json', 'business-metrics.json']
  } else if (includesAny(normalized, ['venta', 'sales', 'revenue', 'transacci', 'billing', 'factur'])) {
    const requestedYear = parseRequestedYear(normalized)
    const requestedMonth = parseRequestedMonth(normalized)
    const selectedMetrics = metrics.filter((metric) => {
      const yearMatches = !requestedYear || Number(metric.year) === requestedYear
      const monthMatches = !requestedMonth || Number(metric.month) === requestedMonth
      return yearMatches && monthMatches
    })
    const sourceMetrics = selectedMetrics.length > 0 ? selectedMetrics : metrics
    const totalSales = sourceMetrics.reduce((sum, metric) => sum + Number(metric.totalSales || 0), 0)
    const totalProfit = sourceMetrics.reduce((sum, metric) => sum + Number(metric.profit || 0), 0)
    const highestTransaction = [...sales].sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0))[0]
    const period = requestedMonth && requestedYear
      ? monthName(requestedYear, requestedMonth, language)
      : requestedYear
        ? String(requestedYear)
        : language === 'es' ? 'todo el periodo' : 'the full period'
    answer = language === 'es'
      ? `Ventas para ${period}: ${formatCurrency(totalSales, language)} con ganancia de ${formatCurrency(totalProfit, language)}. El dataset contiene ${formatNumber(sales.length, language)} transacciones; la transaccion mas alta fue de ${formatCurrency(highestTransaction?.totalAmount, language)}.`
      : `Sales for ${period}: ${formatCurrency(totalSales, language)} with ${formatCurrency(totalProfit, language)} in profit. The dataset contains ${formatNumber(sales.length, language)} transactions; the highest transaction was ${formatCurrency(highestTransaction?.totalAmount, language)}.`
    sources = ['sales-transactions.json', 'dashboard.json']
  } else {
    answer = language === 'es'
      ? `Puedo responder sobre ventas, ganancias, costos, productos, clientes, tendencias, pronosticos y documentos. Resumen: ventas ${formatCurrency(dashboard.totalSales, language)}, ganancia ${formatCurrency(dashboard.totalProfit, language)}, ${products.length} productos, ${customers.length} clientes y ${metrics.length} meses de metricas.`
      : `I can answer questions about sales, profit, costs, products, customers, trends, forecasts, and documents. Summary: ${formatCurrency(dashboard.totalSales, language)} in sales, ${formatCurrency(dashboard.totalProfit, language)} in profit, ${products.length} products, ${customers.length} customers, and ${metrics.length} months of metrics.`
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
