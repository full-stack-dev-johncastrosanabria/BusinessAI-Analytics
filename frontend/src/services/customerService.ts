import api from './api'

export interface Customer {
  id: number
  name: string
  email: string
  segment: string
  country: string
}

export interface CreateCustomerRequest {
  name: string
  email: string
  segment: string
  country: string
}

const customerService = {
  // Get all customers
  getCustomers: async (): Promise<Customer[]> => {
    const response = await api.get('/api/customers')
    return response.data
  },

  // Get customer by ID
  getCustomer: async (id: number): Promise<Customer> => {
    const response = await api.get(`/api/customers/${id}`)
    return response.data
  },

  // Create customer
  createCustomer: async (customer: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.post('/api/customers', customer)
    return response.data
  },

  // Update customer
  updateCustomer: async (id: number, customer: CreateCustomerRequest): Promise<Customer> => {
    const response = await api.put(`/api/customers/${id}`, customer)
    return response.data
  },

  // Delete customer
  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/api/customers/${id}`)
  },
}

export default customerService
