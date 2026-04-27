import { api } from '../lib/api'

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
    const params: Record<string, string> = {}
    if (filter?.dateFrom) params.dateFrom = filter.dateFrom
    if (filter?.dateTo) params.dateTo = filter.dateTo
    if (filter?.customerId) params.customerId = filter.customerId.toString()
    if (filter?.productId) params.productId = filter.productId.toString()

    return await api.get<SalesTransaction[]>('/api/sales', { params })
  },

  // Get sales transaction by ID
  getSalesTransaction: async (id: number): Promise<SalesTransaction> => {
    return await api.get<SalesTransaction>(`/api/sales/${id}`)
  },

  // Create sales transaction
  createSalesTransaction: async (transaction: CreateSalesTransactionRequest): Promise<SalesTransaction> => {
    return await api.post<SalesTransaction>('/api/sales', transaction)
  },
}

export default salesService
