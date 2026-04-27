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
  getSalesForecast: async (): Promise<ForecastResponse> => {
    return await api.post('/api/ai/forecast/sales')
  },

  // Generate cost forecast
  getCostForecast: async (): Promise<ForecastResponse> => {
    return await api.post('/api/ai/forecast/costs')
  },

  // Generate profit forecast
  getProfitForecast: async (): Promise<ForecastResponse> => {
    return await api.post('/api/ai/forecast/profit')
  },

  // Process chatbot query
  processChatbotQuery: async (query: ChatbotQuery): Promise<ChatbotResponse> => {
    return await api.post('/api/ai/chatbot/query', query)
  },

  // Trigger model training (admin endpoint)
  trainModels: async (): Promise<{ message: string }> => {
    return await api.post('/api/ai/train')
  },
}

export default aiService
