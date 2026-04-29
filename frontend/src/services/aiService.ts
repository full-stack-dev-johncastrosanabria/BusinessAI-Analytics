import { api } from '../lib/api'

export interface ForecastPrediction {
  month: string
  value: number
}

export interface ForecastResponse {
  predictions: ForecastPrediction[]
  mape: number
}

export interface ChatbotQuery {
  question: string
}

export interface ChatbotResponse {
  question: string
  answer: string
  sources: string[]
  processingTime: number
}

const aiService = {
  // Generate sales forecast
  getSalesForecast: (): Promise<ForecastResponse> => {
    return api.post<ForecastResponse>('/api/ai/forecast/sales')
  },

  // Generate cost forecast
  getCostForecast: (): Promise<ForecastResponse> => {
    return api.post<ForecastResponse>('/api/ai/forecast/costs')
  },

  // Generate profit forecast
  getProfitForecast: (): Promise<ForecastResponse> => {
    return api.post<ForecastResponse>('/api/ai/forecast/profit')
  },

  // Process chatbot query
  processChatbotQuery: (query: ChatbotQuery): Promise<ChatbotResponse> => {
    return api.post<ChatbotResponse>('/api/ai/chatbot/query', query)
  },

  // Trigger model training (admin endpoint)
  trainModels: (): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/api/ai/train')
  },
}

export default aiService
