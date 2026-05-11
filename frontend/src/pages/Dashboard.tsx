import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { useDashboardSummary, useBusinessMetrics } from '../hooks/useAnalytics'
import { useChartExport } from '../hooks/useChartExport'
import { InteractiveChart } from '../components/ui/InteractiveChart'
import { SkeletonCard } from '../components/Skeleton'
import {
  RevenueGrowthChart,
  SalesByCategoryChart,
  SalesCostProfitChart,
  ProductTreemapChart,
} from '../components/charts'
import './Dashboard.css'

// Chart color palette — consistent with existing charts
const SALES_COLOR = '#8884d8'
const COSTS_COLOR = '#82ca9d'
const PROFIT_COLOR = '#ffc658'
const BAR_COLOR = '#8884d8'

const MONTH_PADDING = 2

// Shared animation variants for KPI cards
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

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

  // ── Existing chart data ──────────────────────────────────────────────────
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

  // ── New chart data ───────────────────────────────────────────────────────

  // 1. Revenue Growth — cumulative sum of sales over time
  const revenueGrowthData = useMemo(() => {
    let cumulative = 0
    return chartData.map((d) => {
      cumulative += d.sales
      return { month: d.month, sales: d.sales, cumulative }
    })
  }, [chartData])

  // 2. Sales by Category — derived from topProducts (group by category)
  const salesByCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>()
    for (const p of summary?.topProducts || []) {
      const cat = p.category || 'Other'
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + p.totalRevenue)
    }
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [summary])

  // 3. Composed chart — same chartData (sales / costs / profit)
  const composedData = chartData

  // 4. Treemap — top products by revenue
  const treemapData = useMemo(
    () =>
      (summary?.topProducts || []).map((p) => ({
        name: p.name,
        value: p.totalRevenue,
        category: p.category,
      })),
    [summary]
  )

  // ── Export hooks ─────────────────────────────────────────────────────────
  const trendExport = useChartExport({ data: chartData, filename: 'sales-trend' })
  const productsExport = useChartExport({ data: topProductsData, filename: 'top-products' })

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="dashboard">
        <h1 className="dashboard__title">{t('dashboard.title')}</h1>
        <div className="metrics-grid" aria-busy="true" aria-label={t('common.loading')}>
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
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
        {t('common.error')}: {error instanceof Error ? error.message : t('common.error')}
      </div>
    )
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">{t('dashboard.title')}</h1>

      {/* Date Range Filter */}
      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="date-from">{t('sales.date')} ({t('common.filter')} from):</label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="date-to">{t('sales.date')} ({t('common.filter')} to):</label>
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

      {/* ── KPI Cards ── */}
      {summary && (
        <div className="metrics-grid">
          {[
            { label: t('dashboard.totalSales'),  value: `$${summary.totalSales.toFixed(2)}` },
            { label: t('dashboard.totalCosts'),  value: `$${summary.totalCosts.toFixed(2)}` },
            { label: t('dashboard.totalProfit'), value: `$${summary.totalProfit.toFixed(2)}` },
            {
              label: t('dashboard.bestMonth'),
              value: `${summary.bestMonth?.year}-${String(summary.bestMonth?.month).padStart(2, '0')}`,
              sub: `$${summary.bestMonth?.profit.toFixed(2)}`,
            },
            {
              label: t('dashboard.worstMonth'),
              value: `${summary.worstMonth?.year}-${String(summary.worstMonth?.month).padStart(MONTH_PADDING, '0')}`,
              sub: `$${summary.worstMonth?.profit.toFixed(2)}`,
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              className="metric-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <h3>{card.label}</h3>
              <p className="metric-value">{card.value}</p>
              {card.sub && <p className="metric-subtext">{card.sub}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {/* Clicked point feedback */}
      {clickedPoint && (
        <div className="dashboard-click-info" role="status" aria-live="polite">
          {clickedPoint}
          <button
            className="dashboard-click-dismiss"
            onClick={() => setClickedPoint(null)}
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Row 1: Existing charts (Sales Trend + Top Products) ── */}
      <div className="charts-section">
        <div className="chart-container">
          <InteractiveChart
            title={t('dashboard.salesTrend')}
            data={chartData}
            xDataKey="month"
            chartType="line"
            series={[
              { dataKey: 'sales', color: SALES_COLOR, name: t('dashboard.charts.sales') },
              { dataKey: 'costs', color: COSTS_COLOR, name: t('dashboard.charts.costs') },
              { dataKey: 'profit', color: PROFIT_COLOR, name: t('dashboard.charts.profit') },
            ]}
            onDataPointClick={(dataKey, value, entry) =>
              setClickedPoint(`${entry.month} — ${dataKey}: ${value}`)
            }
            onExportCSV={trendExport.exportCSV}
            onExportJSON={trendExport.exportJSON}
          />
        </div>

        {topProductsData.length > 0 && (
          <div className="chart-container">
            <InteractiveChart
              title={t('dashboard.topProducts')}
              data={topProductsData}
              xDataKey="name"
              chartType="bar"
              series={[{ dataKey: 'totalRevenue', color: BAR_COLOR, name: t('dashboard.charts.revenue') }]}
              onDataPointClick={(dataKey, value, entry) =>
                setClickedPoint(`${entry.name} — ${dataKey}: ${value}`)
              }
              onExportCSV={productsExport.exportCSV}
              onExportJSON={productsExport.exportJSON}
            />
          </div>
        )}
      </div>

      {/* ── Row 2: Revenue Growth + Sales by Category ── */}
      {revenueGrowthData.length > 0 && (
        <div className="charts-section charts-section--2col">
          <div className="chart-container">
            <RevenueGrowthChart data={revenueGrowthData} height={280} />
          </div>
          {salesByCategoryData.length > 0 && (
            <div className="chart-container">
              <SalesByCategoryChart data={salesByCategoryData} height={280} />
            </div>
          )}
        </div>
      )}

      {/* ── Row 3: Composed Chart (full width) ── */}
      {composedData.length > 0 && (
        <div className="charts-section charts-section--full">
          <div className="chart-container">
            <SalesCostProfitChart data={composedData} height={320} />
          </div>
        </div>
      )}

      {/* ── Row 4: Treemap (full width) ── */}
      {treemapData.length > 0 && (
        <div className="charts-section charts-section--full">
          <div className="chart-container">
            <ProductTreemapChart data={treemapData} height={320} />
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
