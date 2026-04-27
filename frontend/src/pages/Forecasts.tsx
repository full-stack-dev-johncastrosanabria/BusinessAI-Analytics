import { useTransition } from 'react'
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
import './Forecasts.css'

// Helper hooks to reduce cognitive complexity
function useForecastHandlers({ generateSales, generateCost, generateProfit, generateAll, startTransition }) {
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

function useForecastState({ generateSales, generateCost, generateProfit, generateAll, isPending }) {
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

function useCombinedForecastData({ salesQuery, costQuery, profitQuery }) {
  return salesQuery.data && costQuery.data && profitQuery.data
    ? salesQuery.data.predictions.map((item, index) => ({
        month: item.month,
        sales: item.value,
        cost: costQuery.data.predictions[index]?.value || 0,
        profit: profitQuery.data.predictions[index]?.value || 0,
      }))
    : []
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
        {/* Sales Forecast */}
        <div className="forecast-card">
          <div className="forecast-header">
            <h2>Sales Forecast</h2>
            <button
              onClick={handleGenerateSales}
              disabled={isLoading}
              className="btn-secondary"
            >
              {generateSales.isPending ? 'Loading...' : 'Generate'}
            </button>
          </div>
          {salesQuery.data ? (
            <>
              {salesQuery.data.mape !== null && (
                <div className="forecast-metric">
                  <span>MAPE:</span>
                  <strong>{salesQuery.data.mape.toFixed(2)}%</strong>
                </div>
              )}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesQuery.data.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : salesQuery.isLoading ? (
            <div className="placeholder">Loading...</div>
          ) : (
            <div className="placeholder">Click "Generate" to create forecast</div>
          )}
        </div>

        {/* Cost Forecast */}
        <div className="forecast-card">
          <div className="forecast-header">
            <h2>Cost Forecast</h2>
            <button
              onClick={handleGenerateCost}
              disabled={isLoading}
              className="btn-secondary"
            >
              {generateCost.isPending ? 'Loading...' : 'Generate'}
            </button>
          </div>
          {costQuery.data ? (
            <>
              {costQuery.data.mape !== null && (
                <div className="forecast-metric">
                  <span>MAPE:</span>
                  <strong>{costQuery.data.mape.toFixed(2)}%</strong>
                </div>
              )}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costQuery.data.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : costQuery.isLoading ? (
            <div className="placeholder">Loading...</div>
          ) : (
            <div className="placeholder">Click "Generate" to create forecast</div>
          )}
        </div>

        {/* Profit Forecast */}
        <div className="forecast-card">
          <div className="forecast-header">
            <h2>Profit Forecast</h2>
            <button
              onClick={handleGenerateProfit}
              disabled={isLoading}
              className="btn-secondary"
            >
              {generateProfit.isPending ? 'Loading...' : 'Generate'}
            </button>
          </div>
          {profitQuery.data ? (
            <>
              {profitQuery.data.mape !== null && (
                <div className="forecast-metric">
                  <span>MAPE:</span>
                  <strong>{profitQuery.data.mape.toFixed(2)}%</strong>
                </div>
              )}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profitQuery.data.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : profitQuery.isLoading ? (
            <div className="placeholder">Loading...</div>
          ) : (
            <div className="placeholder">Click "Generate" to create forecast</div>
          )}
        </div>
      </div>

      {/* Combined View */}
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
