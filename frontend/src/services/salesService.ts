import api from './api'

export interface SalesTransaction {
  id: number
  customerId: number
  productId: number
  transactionDate: string
  quantity: number
  totalAmount: number
}

export interface CreateSalesTransactionRequest {
  customerId: number
  productId: number
  transactionDate: string
  quantity: number
}

export interface SalesFilter {
  dateFrom?: string
  dateTo?: string
  customerId?: number
  productId?: number
}

const salesService = {
  // Get all sales transactions with optional filters
  getSalesTransactions: async (filter?: SalesFilter): Promise<SalesTransaction[]> => {
    const params = new URLSearchParams()
    if (filter?.dateFrom) params.append('dateFrom', filter.dateFrom)
    if (filter?.dateTo) params.append('dateTo', filter.dateTo)
    if (filter?.customerId) params.append('customerId', filter.customerId.toString())
    if (filter?.productId) params.append('productId', filter.productId.toString())

    const response = await api.get('/api/sales', { params })
    return response.data
  },

  // Get sales transaction by ID
  getSalesTransaction: async (id: number): Promise<SalesTransaction> => {
    const response = await api.get(`/api/sales/${id}`)
    return response.data
  },

  // Create sales transaction
  createSalesTransaction: async (transaction: CreateSalesTransactionRequest): Promise<SalesTransaction> => {
    const response = await api.post('/api/sales', transaction)
    return response.data
  },
}

export default salesService
