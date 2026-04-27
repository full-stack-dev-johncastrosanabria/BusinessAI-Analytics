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
  BarChart,
  Bar,
} from 'recharts'
import { useDashboardSummary, useBusinessMetrics } from '../hooks/useAnalytics'
import './Dashboard.css'

// Chart configuration constants
const CHART_HEIGHT = 300
const CHART_WIDTH = "100%"
const GRID_STROKE_DASH = "3 3"
const MONTH_PADDING = 2

// Chart colors
const SALES_COLOR = "#8884d8"
const COSTS_COLOR = "#82ca9d"
const PROFIT_COLOR = "#ffc658"
const BAR_COLOR = "#8884d8"

function Dashboard() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Queries
  const summaryQuery = useDashboardSummary()
  const metricsQuery = useBusinessMetrics({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const handleFilterChange = () => {
    metricsQuery.refetch()
  }

  const isLoading = summaryQuery.isLoading || metricsQuery.isLoading
  const error = summaryQuery.error || metricsQuery.error

  if (isLoading) {
    return <div className="dashboard loading">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="dashboard error">
        Error: {error instanceof Error ? error.message : 'Failed to load dashboard data'}
      </div>
    )
  }

  const summary = summaryQuery.data
  const metrics = metricsQuery.data || []

  const chartData = metrics.map((m) => ({
    month: `${m.year}-${String(m.month).padStart(2, '0')}`,
    sales: m.totalSales,
    costs: m.totalCosts,
    profit: m.profit,
  }))

  const topProductsData = summary?.topProducts || []

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Date Range Filter */}
      <div className="filter-section">
        <div className="filter-group">
          <label>From Date:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>To Date:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <button onClick={handleFilterChange} className="filter-button">
          Apply Filter
        </button>
      </div>

      {/* Key Metrics */}
      {summary && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total Sales</h3>
            <p className="metric-value">${summary.totalSales.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Total Costs</h3>
            <p className="metric-value">${summary.totalCosts.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Total Profit</h3>
            <p className="metric-value">${summary.totalProfit.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Best Month</h3>
            <p className="metric-value">
              {summary.bestMonth?.year}-{String(summary.bestMonth?.month).padStart(2, '0')}
            </p>
            <p className="metric-subtext">${summary.bestMonth?.profit.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Worst Month</h3>
            <p className="metric-value">
              {summary.worstMonth?.year}-{String(summary.worstMonth?.month).padStart(MONTH_PADDING, '0')}
            </p>
            <p className="metric-subtext">${summary.worstMonth?.profit.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h2>Sales, Costs & Profit Trends</h2>
          <ResponsiveContainer width={CHART_WIDTH} height={CHART_HEIGHT}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray={GRID_STROKE_DASH} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke={SALES_COLOR} />
              <Line type="monotone" dataKey="costs" stroke={COSTS_COLOR} />
              <Line type="monotone" dataKey="profit" stroke={PROFIT_COLOR} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        {topProductsData.length > 0 && (
          <div className="chart-container">
            <h2>Top 5 Products by Revenue</h2>
            <ResponsiveContainer width={CHART_WIDTH} height={CHART_HEIGHT}>
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray={GRID_STROKE_DASH} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRevenue" fill={BAR_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
