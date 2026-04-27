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
    const response = await api.post('/api/ai/forecast/sales')
  },

  // Generate cost forecast
  getCostForecast: async (): Promise<ForecastResponse> => {
    const response = await api.post('/api/ai/forecast/costs')
  },

  // Generate profit forecast
  getProfitForecast: async (): Promise<ForecastResponse> => {
    const response = await api.post('/api/ai/forecast/profit')
  },

  // Process chatbot query
  processChatbotQuery: async (query: ChatbotQuery): Promise<ChatbotResponse> => {
    const response = await api.post('/api/ai/chatbot/query', query)
  },

  // Trigger model training (admin endpoint)
  trainModels: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/ai/train')
  },
}

export default aiService
