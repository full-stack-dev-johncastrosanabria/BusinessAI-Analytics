import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Forecasts from '../Forecasts'
import * as aiService from '../../services/aiService'

vi.mock('../../services/aiService')

const mockForecastResponse = {
  predictions: [
    { month: '2024-01', value: 10000 },
    { month: '2024-02', value: 11000 },
    { month: '2024-03', value: 12000 },
  ],
  mape: 5.5,
}

describe('Forecasts Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders forecast page with three sections', () => {
    render(<Forecasts />)

    expect(screen.getByText('Sales Forecast')).toBeInTheDocument()
    expect(screen.getByText('Cost Forecast')).toBeInTheDocument()
    expect(screen.getByText('Profit Forecast')).toBeInTheDocument()
  })

  it('renders generate all forecasts button', () => {
    render(<Forecasts />)

    expect(screen.getByText('Generate All Forecasts')).toBeInTheDocument()
  })

  it('shows placeholder text before forecast is generated', () => {
    render(<Forecasts />)

    const placeholders = screen.getAllByText('Click "Generate" to create forecast')
    expect(placeholders.length).toBe(3)
  })

  it('shows loading state when generating forecasts', async () => {
    vi.mocked(aiService.default.getSalesForecast).mockReturnValue(new Promise(() => {}))
    vi.mocked(aiService.default.getCostForecast).mockReturnValue(new Promise(() => {}))
    vi.mocked(aiService.default.getProfitForecast).mockReturnValue(new Promise(() => {}))

    render(<Forecasts />)

    fireEvent.click(screen.getByText('Generate All Forecasts'))

    await waitFor(() => {
      expect(screen.getByText('Generating...')).toBeInTheDocument()
    })
  })

  it('displays sales forecast data after generation', async () => {
    vi.mocked(aiService.default.getSalesForecast).mockResolvedValue(mockForecastResponse)
    vi.mocked(aiService.default.getCostForecast).mockResolvedValue(mockForecastResponse)
    vi.mocked(aiService.default.getProfitForecast).mockResolvedValue(mockForecastResponse)

    render(<Forecasts />)

    fireEvent.click(screen.getByText('Generate All Forecasts'))

    await waitFor(() => {
      // MAPE values should be displayed
      const mapeElements = screen.getAllByText('5.50%')
      expect(mapeElements.length).toBeGreaterThan(0)
    })
  })

  it('displays error message on forecast failure', async () => {
    vi.mocked(aiService.default.getSalesForecast).mockRejectedValue(
      new Error('Failed to generate sales forecast')
    )
    vi.mocked(aiService.default.getCostForecast).mockResolvedValue(mockForecastResponse)
    vi.mocked(aiService.default.getProfitForecast).mockResolvedValue(mockForecastResponse)

    render(<Forecasts />)

    // Click individual sales generate button
    const generateButtons = screen.getAllByText('Generate')
    fireEvent.click(generateButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Failed to generate sales forecast/i)).toBeInTheDocument()
    })
  })

  it('calls getSalesForecast when sales generate button is clicked', async () => {
    vi.mocked(aiService.default.getSalesForecast).mockResolvedValue(mockForecastResponse)

    render(<Forecasts />)

    const generateButtons = screen.getAllByText('Generate')
    fireEvent.click(generateButtons[0])

    await waitFor(() => {
      expect(aiService.default.getSalesForecast).toHaveBeenCalledTimes(1)
    })
  })
})
