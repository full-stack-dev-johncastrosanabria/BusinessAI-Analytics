import { describe, it, expect, vi, beforeEach } from 'vitest'
import customerService from '../customerService'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockCustomer = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  segment: 'Premium',
  country: 'US',
}

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getCustomers fetches all customers', async () => {
    vi.mocked(api.get).mockResolvedValue([mockCustomer])
    const result = await customerService.getCustomers()
    expect(api.get).toHaveBeenCalledWith('/api/customers')
    expect(result).toEqual([mockCustomer])
  })

  it('getCustomer fetches customer by id', async () => {
    vi.mocked(api.get).mockResolvedValue(mockCustomer)
    const result = await customerService.getCustomer(1)
    expect(api.get).toHaveBeenCalledWith('/api/customers/1')
    expect(result).toEqual(mockCustomer)
  })

  it('createCustomer posts new customer', async () => {
    vi.mocked(api.post).mockResolvedValue(mockCustomer)
    const request = { name: 'John Doe', email: 'john@example.com', segment: 'Premium', country: 'US' }
    const result = await customerService.createCustomer(request)
    expect(api.post).toHaveBeenCalledWith('/api/customers', request)
    expect(result).toEqual(mockCustomer)
  })

  it('updateCustomer puts updated customer', async () => {
    vi.mocked(api.put).mockResolvedValue(mockCustomer)
    const request = { name: 'John Updated', email: 'john@example.com', segment: 'Premium', country: 'US' }
    const result = await customerService.updateCustomer(1, request)
    expect(api.put).toHaveBeenCalledWith('/api/customers/1', request)
    expect(result).toEqual(mockCustomer)
  })

  it('deleteCustomer deletes by id', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)
    await customerService.deleteCustomer(1)
    expect(api.delete).toHaveBeenCalledWith('/api/customers/1')
  })

  it('getCustomers propagates errors', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Server error'))
    await expect(customerService.getCustomers()).rejects.toThrow('Server error')
  })
})
