import { describe, it, expect, vi, beforeEach } from 'vitest'
import salesService from '../salesService'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockTransaction = {
  id: 1,
  customerId: 2,
  productId: 3,
  transactionDate: '2024-01-15',
  quantity: 5,
  totalAmount: 499.95,
}

describe('salesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSalesTransactions fetches without filter', async () => {
    vi.mocked(api.get).mockResolvedValue([mockTransaction])
    const result = await salesService.getSalesTransactions()
    expect(api.get).toHaveBeenCalledWith('/api/sales', { params: {} })
    expect(result).toEqual([mockTransaction])
  })

  it('getSalesTransactions with dateFrom filter', async () => {
    vi.mocked(api.get).mockResolvedValue([mockTransaction])
    await salesService.getSalesTransactions({ dateFrom: '2024-01-01' })
    expect(api.get).toHaveBeenCalledWith('/api/sales', {
      params: { dateFrom: '2024-01-01' },
    })
  })

  it('getSalesTransactions with dateTo filter', async () => {
    vi.mocked(api.get).mockResolvedValue([mockTransaction])
    await salesService.getSalesTransactions({ dateTo: '2024-12-31' })
    expect(api.get).toHaveBeenCalledWith('/api/sales', {
      params: { dateTo: '2024-12-31' },
    })
  })

  it('getSalesTransactions with customerId filter', async () => {
    vi.mocked(api.get).mockResolvedValue([mockTransaction])
    await salesService.getSalesTransactions({ customerId: 5 })
    expect(api.get).toHaveBeenCalledWith('/api/sales', {
      params: { customerId: '5' },
    })
  })

  it('getSalesTransactions with productId filter', async () => {
    vi.mocked(api.get).mockResolvedValue([mockTransaction])
    await salesService.getSalesTransactions({ productId: 3 })
    expect(api.get).toHaveBeenCalledWith('/api/sales', {
      params: { productId: '3' },
    })
  })

  it('getSalesTransactions with all filters', async () => {
    vi.mocked(api.get).mockResolvedValue([mockTransaction])
    await salesService.getSalesTransactions({
      dateFrom: '2024-01-01',
      dateTo: '2024-12-31',
      customerId: 2,
      productId: 3,
    })
    expect(api.get).toHaveBeenCalledWith('/api/sales', {
      params: {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        customerId: '2',
        productId: '3',
      },
    })
  })

  it('getSalesTransaction fetches by id', async () => {
    vi.mocked(api.get).mockResolvedValue(mockTransaction)
    const result = await salesService.getSalesTransaction(1)
    expect(api.get).toHaveBeenCalledWith('/api/sales/1')
    expect(result).toEqual(mockTransaction)
  })

  it('createSalesTransaction posts new transaction', async () => {
    vi.mocked(api.post).mockResolvedValue(mockTransaction)
    const request = {
      customerId: 2,
      productId: 3,
      transactionDate: '2024-01-15',
      quantity: 5,
    }
    const result = await salesService.createSalesTransaction(request)
    expect(api.post).toHaveBeenCalledWith('/api/sales', request)
    expect(result).toEqual(mockTransaction)
  })

  it('getSalesTransactions propagates errors', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Network error'))
    await expect(salesService.getSalesTransactions()).rejects.toThrow('Network error')
  })
})
