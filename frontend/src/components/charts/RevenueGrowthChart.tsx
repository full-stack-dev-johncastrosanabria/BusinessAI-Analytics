import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import './charts.css'

export interface RevenueGrowthPoint {
  readonly month: string
  readonly sales: number
  readonly cumulative: number
}

interface Props {
  readonly data: RevenueGrowthPoint[]
  readonly height?: number
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="chart-tooltip__row" style={{ color: entry.color }}>
          <span className="chart-tooltip__name">
            {entry.dataKey === 'cumulative'
              ? t('dashboard.charts.cumulative')
              : t('dashboard.charts.monthlySales')}
            :
          </span>
          <span className="chart-tooltip__value">
            ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

export function RevenueGrowthChart({ data, height = 280 }: Props) {
  const { t } = useTranslation()

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">{t('dashboard.charts.revenueGrowth')}</h3>
        <span className="chart-badge chart-badge--blue">{t('dashboard.charts.cumulative')}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--chart-axis-text)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--chart-axis-text)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#gradSales)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#gradCumulative)"
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
