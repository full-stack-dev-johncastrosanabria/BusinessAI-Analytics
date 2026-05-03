import { describe, it, expect } from 'vitest'
import { forecastKeys } from '../useForecasts'

describe('forecastKeys', () => {
  it('all returns base key', () => {
    expect(forecastKeys.all).toEqual(['forecasts'])
  })

  it('sales returns sales key', () => {
    expect(forecastKeys.sales()).toEqual(['forecasts', 'sales'])
  })

  it('costs returns costs key', () => {
    expect(forecastKeys.costs()).toEqual(['forecasts', 'costs'])
  })

  it('profit returns profit key', () => {
    expect(forecastKeys.profit()).toEqual(['forecasts', 'profit'])
  })
})

describe('useForecasts hook exports', () => {
  it('exports useSalesForecast', async () => {
    const mod = await import('../useForecasts')
    expect(typeof mod.useSalesForecast).toBe('function')
  })

  it('exports useCostForecast', async () => {
    const mod = await import('../useForecasts')
    expect(typeof mod.useCostForecast).toBe('function')
  })

  it('exports useProfitForecast', async () => {
    const mod = await import('../useForecasts')
    expect(typeof mod.useProfitForecast).toBe('function')
  })

  it('exports useGenerateSalesForecast', async () => {
    const mod = await import('../useForecasts')
    expect(typeof mod.useGenerateSalesForecast).toBe('function')
  })

  it('exports useGenerateCostForecast', async () => {
    const mod = await import('../useForecasts')
    expect(typeof mod.useGenerateCostForecast).toBe('function')
  })

  it('exports useGenerateProfitForecast', async () => {
    const mod = await import('../useForecasts')
    expect(typeof mod.useGenerateProfitForecast).toBe('function')
  })

  it('exports useGenerateAllForecasts', async () => {
    const mod = await import('../useForecasts')
    expect(typeof mod.useGenerateAllForecasts).toBe('function')
  })
})
