import { useTransition } from 'react'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  useGenerateSalesForecast,
  useGenerateCostForecast,
  useGenerateProfitForecast,
  useGenerateAllForecasts,
  useSalesForecast,
  useCostForecast,
  useProfitForecast,
} from '../hooks/useForecasts'
import type { ForecastPrediction, ForecastResponse } from '../hooks/useForecasts'
import './Forecasts.css'

type ForecastMutation = UseMutationResult<ForecastResponse, Error, void, unknown>
type AllForecastsMutation = UseMutationResult<{
  sales: ForecastResponse
  costs: ForecastResponse
  profit: ForecastResponse
}, Error, void, unknown>

interface ForecastHandlersInput {
  readonly generateSales: ForecastMutation
  readonly generateCost: ForecastMutation
  readonly generateProfit: ForecastMutation
  readonly generateAll: AllForecastsMutation
  readonly startTransition: (callback: () => void) => void
}

interface ForecastStateInput {
  readonly generateSales: ForecastMutation
  readonly generateCost: ForecastMutation
  readonly generateProfit: ForecastMutation
  readonly generateAll: AllForecastsMutation
  readonly isPending: boolean
}

interface CombinedForecastDataInput {
  readonly salesQuery: UseQueryResult<ForecastResponse, Error>
  readonly costQuery: UseQueryResult<ForecastResponse, Error>
  readonly profitQuery: UseQueryResult<ForecastResponse, Error>
}

interface CombinedForecastPoint {
  readonly month: string
  readonly sales: number
  readonly cost: number
  readonly profit: number
}

// Helper hooks to reduce cognitive complexity
function useForecastHandlers({
  generateSales,
  generateCost,
  generateProfit,
  generateAll,
  startTransition,
}: ForecastHandlersInput) {
  const handleGenerateAll = () => {
    startTransition(() => {
      generateAll.mutate()
    })
  }

  const handleGenerateSales = () => {
    startTransition(() => {
      generateSales.mutate()
    })
  }

  const handleGenerateCost = () => {
    startTransition(() => {
      generateCost.mutate()
    })
  }

  const handleGenerateProfit = () => {
    startTransition(() => {
      generateProfit.mutate()
    })
  }

  return {
    handleGenerateAll,
    handleGenerateSales,
    handleGenerateCost,
    handleGenerateProfit
  }
}

function useForecastState({
  generateSales,
  generateCost,
  generateProfit,
  generateAll,
  isPending,
}: ForecastStateInput) {
  const isLoading =
    generateSales.isPending ||
    generateCost.isPending ||
    generateProfit.isPending ||
    generateAll.isPending ||
    isPending

  const error =
    generateSales.error || generateCost.error || generateProfit.error || generateAll.error

  return { isLoading, error }
}

function useCombinedForecastData({
  salesQuery,
  costQuery,
  profitQuery,
}: CombinedForecastDataInput): CombinedForecastPoint[] {
  if (!salesQuery.data || !costQuery.data || !profitQuery.data) {
    return []
  }

  // Create maps for efficient lookup by month (stable identifier)
  const costByMonth = new Map(
    costQuery.data.predictions.map((pred: ForecastPrediction) => [pred.month, pred.value])
  )
  const profitByMonth = new Map(
    profitQuery.data.predictions.map((pred: ForecastPrediction) => [pred.month, pred.value])
  )

  return salesQuery.data.predictions.map((item: ForecastPrediction) => ({
    month: item.month,
    sales: item.value,
    cost: costByMonth.get(item.month) || 0,
    profit: profitByMonth.get(item.month) || 0,
  }))
}

// Helper component to render individual forecast card
interface ForecastCardProps {
  readonly title: string
  readonly query: UseQueryResult<ForecastResponse, Error>
  readonly mutation: ForecastMutation
  readonly onGenerate: () => void
  readonly isLoading: boolean
  readonly lineColor: string
}

function ForecastCard({
  title,
  query,
  mutation,
  onGenerate,
  isLoading,
  lineColor
}: ForecastCardProps) {
  return (
    <div className="forecast-card">
      <div className="forecast-header">
        <h2>{title}</h2>
        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="btn-secondary"
        >
          {mutation.isPending ? 'Loading...' : 'Generate'}
        </button>
      </div>
      {query.data ? (
        <>
          {query.data.mape !== null && (
            <div className="forecast-metric">
              <span>MAPE:</span>
              <strong>{query.data.mape.toFixed(2)}%</strong>
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={query.data.predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={lineColor} />
            </LineChart>
          </ResponsiveContainer>
        </>
      ) : (
        <div className="placeholder">
          {query.isLoading ? 'Loading...' : 'Click "Generate" to create forecast'}
        </div>
      )}
    </div>
  )
}

function Forecasts() {
  const [isPending, startTransition] = useTransition()

  // Queries
  const salesQuery = useSalesForecast()
  const costQuery = useCostForecast()
  const profitQuery = useProfitForecast()

  // Mutations
  const generateSales = useGenerateSalesForecast()
  const generateCost = useGenerateCostForecast()
  const generateProfit = useGenerateProfitForecast()
  const generateAll = useGenerateAllForecasts()

  // Extract handlers to reduce complexity
  const handlers = useForecastHandlers({
    generateSales,
    generateCost,
    generateProfit,
    generateAll,
    startTransition
  })

  // Extract loading and error state logic
  const { isLoading, error } = useForecastState({
    generateSales,
    generateCost,
    generateProfit,
    generateAll,
    isPending
  })

  // Extract data combination logic
  const combinedData = useCombinedForecastData({
    salesQuery,
    costQuery,
    profitQuery
  })

  const {
    handleGenerateAll,
    handleGenerateSales,
    handleGenerateCost,
    handleGenerateProfit
  } = handlers

  return (
    <div className="forecasts">
      <h1>Forecasts</h1>

      {error && (
        <div className="error-message">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      )}

      <div className="forecast-controls">
        <button
          onClick={handleGenerateAll}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Generating...' : 'Generate All Forecasts'}
        </button>
      </div>

      <div className="forecasts-grid">
        <ForecastCard
          title="Sales Forecast"
          query={salesQuery}
          mutation={generateSales}
          onGenerate={handleGenerateSales}
          isLoading={isLoading}
          lineColor="#8884d8"
        />
        <ForecastCard
          title="Cost Forecast"
          query={costQuery}
          mutation={generateCost}
          onGenerate={handleGenerateCost}
          isLoading={isLoading}
          lineColor="#82ca9d"
        />
        <ForecastCard
          title="Profit Forecast"
          query={profitQuery}
          mutation={generateProfit}
          onGenerate={handleGenerateProfit}
          isLoading={isLoading}
          lineColor="#ffc658"
        />
      </div>

      {combinedData.length > 0 && (
        <div className="combined-forecast">
          <h2>Combined Forecast Comparison</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
              <Line type="monotone" dataKey="cost" stroke="#82ca9d" name="Cost" />
              <Line type="monotone" dataKey="profit" stroke="#ffc658" name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Forecasts
