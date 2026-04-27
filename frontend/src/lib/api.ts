/**
 * Modern API client using native fetch
 * Replaces axios with a lightweight, type-safe alternative
 * Includes timeout, retry logic, and comprehensive error handling
 */

// Configuration constants
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'
const REQUEST_TIMEOUT_MS = 30_000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1_000 // 1 second
const CLIENT_ERROR_MIN = 400
const CLIENT_ERROR_MAX = 500

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
  params?: Record<string, string | number | boolean>
  timeout?: number
  retries?: number
}

/**
 * Create an AbortSignal with timeout
 */
function createTimeoutSignal(timeout: number): AbortSignal {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  // Clean up timeout if request completes
  return new Proxy(controller.signal, {
    get(target, prop) {
      if (prop === 'addEventListener') {
        return function(type: string, listener: EventListener) {
          const wrappedListener = (event: Event) => {
            clearTimeout(timeoutId)
            listener.call(listener, event)
          }
          return target.addEventListener(type, wrappedListener)
        }
      }
      return Reflect.get(target, prop)
    }
  })
}

/**
 * Retry logic with exponential backoff
 */
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
      
      // Don't retry on client errors (4xx) or if out of retries
      if (error instanceof APIError && error.status >= CLIENT_ERROR_MIN && error.status < CLIENT_ERROR_MAX) {
        throw error
      }
      
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt) // Exponential backoff
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

  // Build URL with query params
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  // Default headers
  const headers = new Headers(fetchConfig.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return retryRequest(async () => {
    try {
      const signal = createTimeoutSignal(timeout)
      
      const response = await fetch(url.toString(), {
        ...fetchConfig,
        headers,
        signal,
      })

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: unknown = null
        try {
          errorData = await response.json()
        } catch {
          // Response is not JSON, that's okay
        }
        
        throw new APIError(
          (errorData as any)?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData,
          endpoint
        )
      }

      // Parse JSON response
      const data = await response.json()
      return data as T
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

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
}
