import { useState, useEffect } from 'react'
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
import analyticsService, { DashboardSummary, BusinessMetric } from '../services/analyticsService'
import './Dashboard.css'

function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [metrics, setMetrics] = useState<BusinessMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [summaryData, metricsData] = await Promise.all([
        analyticsService.getDashboardSummary(),
        analyticsService.getMetrics({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }),
      ])
      setSummary(summaryData)
      setMetrics(metricsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = () => {
    fetchDashboardData()
  }

  if (loading) {
    return <div className="dashboard loading">Loading dashboard...</div>
  }

  if (error) {
    return <div className="dashboard error">Error: {error}</div>
  }

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
              {summary.worstMonth?.year}-{String(summary.worstMonth?.month).padStart(2, '0')}
            </p>
            <p className="metric-subtext">${summary.worstMonth?.profit.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <h2>Sales, Costs & Profit Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" />
              <Line type="monotone" dataKey="costs" stroke="#82ca9d" />
              <Line type="monotone" dataKey="profit" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        {topProductsData.length > 0 && (
          <div className="chart-container">
            <h2>Top 5 Products by Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalRevenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
