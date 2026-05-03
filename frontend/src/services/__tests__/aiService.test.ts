import { describe, it, expect, vi, beforeEach } from 'vitest'
import aiService from '../aiService'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockForecast = {
  predictions: [{ month: '2024-01', value: 50000 }],
  mape: 5.2,
}

describe('aiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSalesForecast calls correct endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue(mockForecast)
    const result = await aiService.getSalesForecast()
    expect(api.post).toHaveBeenCalledWith('/api/ai/forecast/sales')
    expect(result).toEqual(mockForecast)
  })

  it('getCostForecast calls correct endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue(mockForecast)
    const result = await aiService.getCostForecast()
    expect(api.post).toHaveBeenCalledWith('/api/ai/forecast/costs')
    expect(result).toEqual(mockForecast)
  })

  it('getProfitForecast calls correct endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue(mockForecast)
    const result = await aiService.getProfitForecast()
    expect(api.post).toHaveBeenCalledWith('/api/ai/forecast/profit')
    expect(result).toEqual(mockForecast)
  })

  it('processChatbotQuery calls correct endpoint with query', async () => {
    const mockResponse = {
      question: 'What is revenue?',
      answer: 'Revenue is $100k',
      sources: ['db'],
      processingTime: 0.5,
    }
    vi.mocked(api.post).mockResolvedValue(mockResponse)
    const query = { question: 'What is revenue?' }
    const result = await aiService.processChatbotQuery(query)
    expect(api.post).toHaveBeenCalledWith('/api/ai/chatbot/query', query)
    expect(result).toEqual(mockResponse)
  })

  it('trainModels calls correct endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue({ message: 'Training started' })
    const result = await aiService.trainModels()
    expect(api.post).toHaveBeenCalledWith('/api/ai/train')
    expect(result).toEqual({ message: 'Training started' })
  })

  it('getSalesForecast propagates errors', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Network error'))
    await expect(aiService.getSalesForecast()).rejects.toThrow('Network error')
  })
})
