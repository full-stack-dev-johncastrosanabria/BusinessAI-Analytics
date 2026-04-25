import { useState } from 'react'
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
import aiService, { ForecastResponse } from '../services/aiService'
import './Forecasts.css'

function Forecasts() {
  const [salesForecast, setSalesForecast] = useState<ForecastResponse | null>(null)
  const [costForecast, setCostForecast] = useState<ForecastResponse | null>(null)
  const [profitForecast, setProfitForecast] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSalesForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await aiService.getSalesForecast()
      setSalesForecast(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sales forecast')
    } finally {
      setLoading(false)
    }
  }

  const generateCostForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await aiService.getCostForecast()
      setCostForecast(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cost forecast')
    } finally {
      setLoading(false)
    }
  }

  const generateProfitForecast = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await aiService.getProfitForecast()
      setProfitForecast(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate profit forecast')
    } finally {
      setLoading(false)
    }
  }

  const generateAllForecasts = async () => {
    await Promise.all([
      generateSalesForecast(),
      generateCostForecast(),
      generateProfitForecast(),
    ])
  }

  return (
    <div className="forecasts">
      <h1>Forecasts</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="forecast-controls">
        <button onClick={generateAllForecasts} disabled={loading} className="btn-primary">
          {loading ? 'Generating...' : 'Generate All Forecasts'}
        </button>
      </div>

      <div className="forecasts-grid">
        {/* Sales Forecast */}
        <div className="forecast-card">
          <div className="forecast-header">
            <h2>Sales Forecast</h2>
            <button onClick={generateSalesForecast} disabled={loading} className="btn-secondary">
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
          {salesForecast ? (
            <>
              <div className="forecast-metric">
                <span>MAPE:</span>
                <strong>{salesForecast.mape.toFixed(2)}%</strong>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesForecast.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="placeholder">Click "Generate" to create forecast</div>
          )}
        </div>

        {/* Cost Forecast */}
        <div className="forecast-card">
          <div className="forecast-header">
            <h2>Cost Forecast</h2>
            <button onClick={generateCostForecast} disabled={loading} className="btn-secondary">
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
          {costForecast ? (
            <>
              <div className="forecast-metric">
                <span>MAPE:</span>
                <strong>{costForecast.mape.toFixed(2)}%</strong>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costForecast.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="placeholder">Click "Generate" to create forecast</div>
          )}
        </div>

        {/* Profit Forecast */}
        <div className="forecast-card">
          <div className="forecast-header">
            <h2>Profit Forecast</h2>
            <button onClick={generateProfitForecast} disabled={loading} className="btn-secondary">
              {loading ? 'Loading...' : 'Generate'}
            </button>
          </div>
          {profitForecast ? (
            <>
              <div className="forecast-metric">
                <span>MAPE:</span>
                <strong>{profitForecast.mape.toFixed(2)}%</strong>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={profitForecast.predictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="placeholder">Click "Generate" to create forecast</div>
          )}
        </div>
      </div>

      {/* Combined View */}
      {salesForecast && costForecast && profitForecast && (
        <div className="combined-forecast">
          <h2>Combined Forecast Comparison</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={salesForecast.predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" name="Sales" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#82ca9d"
                name="Cost"
                data={costForecast.predictions}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ffc658"
                name="Profit"
                data={profitForecast.predictions}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Forecasts
