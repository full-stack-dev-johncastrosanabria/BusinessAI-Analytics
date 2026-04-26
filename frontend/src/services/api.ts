import axios, { AxiosInstance, AxiosError } from 'axios'

// Create axios instance with base URL pointing to API Gateway
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens or headers here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized
      console.error('Unauthorized access')
    } else if (error.response?.status === 404) {
      console.error('Resource not found')
    } else if (error.response?.status === 500) {
      console.error('Server error')
    }
    return Promise.reject(error)
  }
)

export default api
