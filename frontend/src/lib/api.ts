/**
 * Modern API client using native fetch
 * Replaces axios with a lightweight, type-safe alternative
 * Includes timeout, retry logic, and comprehensive error handling
 */

// Configuration constants
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080'
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
  readonly params?: Record<string, string | number | boolean>
  readonly timeout?: number
  readonly retries?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Create an AbortSignal with timeout
 */
function createTimeoutSignal(timeout: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId)
  }
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

  // Default headers with security best practices
  const headers = new Headers(fetchConfig.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  // Add security headers
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

        // Handle non-OK responses
        if (!response.ok) {
          let errorData: unknown = null
          try {
            errorData = await response.json()
          } catch {
            // Response is not JSON, that's okay
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
