import { api } from '../lib/api'

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
    return await api.get<Customer[]>('/api/customers')
  },

  // Get customer by ID
  getCustomer: async (id: number): Promise<Customer> => {
    return await api.get<Customer>(`/api/customers/${id}`)
  },

  // Create customer
  createCustomer: async (customer: CreateCustomerRequest): Promise<Customer> => {
    return await api.post<Customer>('/api/customers', customer)
  },

  // Update customer
  updateCustomer: async (id: number, customer: CreateCustomerRequest): Promise<Customer> => {
    return await api.put<Customer>(`/api/customers/${id}`, customer)
  },

  // Delete customer
  deleteCustomer: async (id: number): Promise<void> => {
    await api.delete(`/api/customers/${id}`)
  },
}

export default customerService
