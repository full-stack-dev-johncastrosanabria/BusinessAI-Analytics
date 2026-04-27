/**
 * Modern API client using native fetch
 * Replaces axios with a lightweight, type-safe alternative
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { params, ...fetchConfig } = config

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

  try {
    const response = await fetch(url.toString(), {
      ...fetchConfig,
      headers,
    })

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new APIError(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    // Parse JSON response
    const data = await response.json()
    return data as T
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    throw new APIError(
      error instanceof Error ? error.message : 'Network request failed',
      0
    )
  }
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
