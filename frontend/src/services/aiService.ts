import api from './api'

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
    return response.data
  },

  // Generate cost forecast
  getCostForecast: async (): Promise<ForecastResponse> => {
    const response = await api.post('/api/ai/forecast/costs')
    return response.data
  },

  // Generate profit forecast
  getProfitForecast: async (): Promise<ForecastResponse> => {
    const response = await api.post('/api/ai/forecast/profit')
    return response.data
  },

  // Process chatbot query
  processChatbotQuery: async (query: ChatbotQuery): Promise<ChatbotResponse> => {
    const response = await api.post('/api/ai/chatbot/query', query)
    return response.data
  },

  // Trigger model training (admin endpoint)
  trainModels: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/ai/train')
    return response.data
  },
}

export default aiService
