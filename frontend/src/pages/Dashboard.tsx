import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDashboardSummary, useBusinessMetrics } from '../hooks/useAnalytics'
import { useChartExport } from '../hooks/useChartExport'
import { InteractiveChart } from '../components/ui/InteractiveChart'
import { SkeletonCard } from '../components/Skeleton'
import './Dashboard.css'

// Chart colors
const SALES_COLOR = '#8884d8'
const COSTS_COLOR = '#82ca9d'
const PROFIT_COLOR = '#ffc658'
const BAR_COLOR = '#8884d8'

const MONTH_PADDING = 2

function Dashboard() {
  const { t } = useTranslation()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [clickedPoint, setClickedPoint] = useState<string | null>(null)

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

  const summary = summaryQuery.data
  const metrics = metricsQuery.data || []

  const chartData = metrics.map((m) => ({
    month: `${m.year}-${String(m.month).padStart(2, '0')}`,
    sales: m.totalSales,
    costs: m.totalCosts,
    profit: m.profit,
  }))

  const topProductsData = (summary?.topProducts || []).map((p) => ({
    name: p.name,
    totalRevenue: p.totalRevenue,
  }))

  // Export hooks
  const trendExport = useChartExport({ data: chartData, filename: 'sales-trend' })
  const productsExport = useChartExport({ data: topProductsData, filename: 'top-products' })

  if (isLoading) {
    return (
      <div className="dashboard">
        <h1>{t('dashboard.title')}</h1>
        {/* Skeleton metrics grid */}
        <div className="metrics-grid" aria-busy="true" aria-label="Loading dashboard metrics">
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        {/* Skeleton charts */}
        <div className="charts-section">
          <div className="chart-container skeleton-chart-placeholder" aria-hidden="true" />
          <div className="chart-container skeleton-chart-placeholder" aria-hidden="true" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard error">
        {t('common.error')}: {error instanceof Error ? error.message : 'Failed to load dashboard data'}
      </div>
    )
  }

  return (
    <div className="dashboard">
      <h1>{t('dashboard.title')}</h1>

      {/* Date Range Filter */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="date-from">From Date:</label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="date-to">To Date:</label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <button onClick={handleFilterChange} className="filter-button">
          {t('common.filter')}
        </button>
      </div>

      {/* Key Metrics */}
      {summary && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>{t('dashboard.totalSales')}</h3>
            <p className="metric-value">${summary.totalSales.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Total Costs</h3>
            <p className="metric-value">${summary.totalCosts.toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>{t('dashboard.totalProfit')}</h3>
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

      {/* Clicked point feedback */}
      {clickedPoint && (
        <div className="dashboard-click-info" role="status" aria-live="polite">
          Selected: {clickedPoint}
          <button
            className="dashboard-click-dismiss"
            onClick={() => setClickedPoint(null)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Charts */}
      <div className="charts-section">
        <div className="chart-container">
          <InteractiveChart
            title={t('dashboard.salesTrend')}
            data={chartData}
            xDataKey="month"
            chartType="line"
            series={[
              { dataKey: 'sales', color: SALES_COLOR, name: 'Sales' },
              { dataKey: 'costs', color: COSTS_COLOR, name: 'Costs' },
              { dataKey: 'profit', color: PROFIT_COLOR, name: 'Profit' },
            ]}
            onDataPointClick={(dataKey, value, entry) =>
              setClickedPoint(`${entry.month} — ${dataKey}: ${value}`)
            }
            onExportCSV={trendExport.exportCSV}
            onExportJSON={trendExport.exportJSON}
          />
        </div>

        {/* Top Products */}
        {topProductsData.length > 0 && (
          <div className="chart-container">
            <InteractiveChart
              title={t('dashboard.topProducts')}
              data={topProductsData}
              xDataKey="name"
              chartType="bar"
              series={[{ dataKey: 'totalRevenue', color: BAR_COLOR, name: 'Revenue' }]}
              onDataPointClick={(dataKey, value, entry) =>
                setClickedPoint(`${entry.name} — ${dataKey}: ${value}`)
              }
              onExportCSV={productsExport.exportCSV}
              onExportJSON={productsExport.exportJSON}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
