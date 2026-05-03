import { describe, it, expect, vi } from 'vitest'
import { salesKeys } from '../useSales'

// Test the query key factories (pure functions, no hooks needed)
describe('salesKeys', () => {
  it('all returns base key', () => {
    expect(salesKeys.all).toEqual(['sales'])
  })

  it('lists returns list key', () => {
    expect(salesKeys.lists()).toEqual(['sales', 'list'])
  })

  it('list returns key with params', () => {
    const params = { page: 1, pageSize: 20 }
    const key = salesKeys.list(params)
    expect(key[0]).toBe('sales')
    expect(key[1]).toBe('list')
    expect(key[2]).toEqual(params)
  })

  it('infinite returns infinite key with params', () => {
    const params = { pageSize: 20 }
    const key = salesKeys.infinite(params)
    expect(key[0]).toBe('sales')
    expect(key[1]).toBe('infinite')
    expect(key[2]).toEqual(params)
  })

  it('detail returns detail key with id', () => {
    const key = salesKeys.detail(42)
    expect(key[0]).toBe('sales')
    expect(key[1]).toBe('detail')
    expect(key[2]).toBe(42)
  })

  it('list includes filter params', () => {
    const params = { page: 1, pageSize: 10, startDate: '2024-01-01', endDate: '2024-12-31' }
    const key = salesKeys.list(params)
    expect(key[2]).toMatchObject({ startDate: '2024-01-01', endDate: '2024-12-31' })
  })

  it('infinite includes filter params', () => {
    const params = { pageSize: 20, customerId: 5 }
    const key = salesKeys.infinite(params)
    expect(key[2]).toMatchObject({ customerId: 5 })
  })
})

// Test hook exports exist
describe('useSales hook exports', () => {
  it('exports useSalesTransactions', async () => {
    const module = await import('../useSales')
    expect(typeof module.useSalesTransactions).toBe('function')
  })

  it('exports useInfiniteSalesTransactions', async () => {
    const module = await import('../useSales')
    expect(typeof module.useInfiniteSalesTransactions).toBe('function')
  })

  it('exports useSalesTransaction', async () => {
    const module = await import('../useSales')
    expect(typeof module.useSalesTransaction).toBe('function')
  })

  it('exports useCreateSalesTransaction', async () => {
    const module = await import('../useSales')
    expect(typeof module.useCreateSalesTransaction).toBe('function')
  })

  it('exports useUpdateSalesTransaction', async () => {
    const module = await import('../useSales')
    expect(typeof module.useUpdateSalesTransaction).toBe('function')
  })

  it('exports useDeleteSalesTransaction', async () => {
    const module = await import('../useSales')
    expect(typeof module.useDeleteSalesTransaction).toBe('function')
  })
})
