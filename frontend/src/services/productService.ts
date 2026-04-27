import { api } from '../lib/api'

export interface Product {
  id: number
  name: string
  category: string
  cost: number
  price: number
}

export interface CreateProductRequest {
  name: string
  category: string
  cost: number
  price: number
}

const productService = {
  // Get all products
  getProducts: async (): Promise<Product[]> => {
    return await api.get<Product[]>('/api/products')
  },

  // Get product by ID
  getProduct: async (id: number): Promise<Product> => {
    return await api.get<Product>(`/api/products/${id}`)
  },

  // Create product
  createProduct: async (product: CreateProductRequest): Promise<Product> => {
    return await api.post<Product>('/api/products', product)
  },

  // Update product
  updateProduct: async (id: number, product: CreateProductRequest): Promise<Product> => {
    return await api.put<Product>(`/api/products/${id}`, product)
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/api/products/${id}`)
  },
}

export default productService
