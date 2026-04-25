import api from './api'

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
    const response = await api.get('/api/products')
    return response.data
  },

  // Get product by ID
  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/api/products/${id}`)
    return response.data
  },

  // Create product
  createProduct: async (product: CreateProductRequest): Promise<Product> => {
    const response = await api.post('/api/products', product)
    return response.data
  },

  // Update product
  updateProduct: async (id: number, product: CreateProductRequest): Promise<Product> => {
    const response = await api.put(`/api/products/${id}`, product)
    return response.data
  },

  // Delete product
  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/api/products/${id}`)
  },
}

export default productService
