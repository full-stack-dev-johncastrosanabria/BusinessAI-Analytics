import { describe, it, expect, vi, beforeEach } from 'vitest'
import productService from '../productService'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockProduct = {
  id: 1,
  name: 'Widget A',
  category: 'Electronics',
  cost: 50,
  price: 99.99,
}

describe('productService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getProducts fetches all products', async () => {
    vi.mocked(api.get).mockResolvedValue([mockProduct])
    const result = await productService.getProducts()
    expect(api.get).toHaveBeenCalledWith('/api/products')
    expect(result).toEqual([mockProduct])
  })

  it('getProduct fetches product by id', async () => {
    vi.mocked(api.get).mockResolvedValue(mockProduct)
    const result = await productService.getProduct(1)
    expect(api.get).toHaveBeenCalledWith('/api/products/1')
    expect(result).toEqual(mockProduct)
  })

  it('createProduct posts new product', async () => {
    vi.mocked(api.post).mockResolvedValue(mockProduct)
    const request = { name: 'Widget A', category: 'Electronics', cost: 50, price: 99.99 }
    const result = await productService.createProduct(request)
    expect(api.post).toHaveBeenCalledWith('/api/products', request)
    expect(result).toEqual(mockProduct)
  })

  it('updateProduct puts updated product', async () => {
    vi.mocked(api.put).mockResolvedValue(mockProduct)
    const request = { name: 'Widget B', category: 'Electronics', cost: 55, price: 109.99 }
    const result = await productService.updateProduct(1, request)
    expect(api.put).toHaveBeenCalledWith('/api/products/1', request)
    expect(result).toEqual(mockProduct)
  })

  it('deleteProduct deletes by id', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)
    await productService.deleteProduct(1)
    expect(api.delete).toHaveBeenCalledWith('/api/products/1')
  })

  it('getProducts propagates errors', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Not found'))
    await expect(productService.getProducts()).rejects.toThrow('Not found')
  })
})
