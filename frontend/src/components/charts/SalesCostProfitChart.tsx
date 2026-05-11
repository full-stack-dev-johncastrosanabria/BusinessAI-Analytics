import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import './charts.css'

export interface ComposedPoint {
  readonly month: string
  readonly sales: number
  readonly costs: number
  readonly profit: number
}

interface Props {
  readonly data: ComposedPoint[]
  readonly height?: number
}

const LEGEND_KEYS: Record<string, 'sales' | 'costs' | 'profit'> = {
  sales: 'sales',
  costs: 'costs',
  profit: 'profit',
}

function ComposedTooltip({ active, payload, label }: TooltipProps<number, string>) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const labelMap: Record<string, string> = {
    sales: t('dashboard.charts.sales'),
    costs: t('dashboard.charts.costs'),
    profit: t('dashboard.charts.profit'),
  }
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="chart-tooltip__row" style={{ color: entry.color }}>
          <span className="chart-tooltip__name">{labelMap[entry.dataKey as string] ?? entry.dataKey}:</span>
          <span className="chart-tooltip__value">
            ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

function legendFormatter(value: string, t: (key: string) => string): string {
  const key = LEGEND_KEYS[value]
  if (key === 'sales') return t('dashboard.charts.sales')
  if (key === 'costs') return t('dashboard.charts.costs')
  return t('dashboard.charts.profit')
}

function LegendLabel({ value, t }: { readonly value: string; readonly t: (k: string) => string }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--chart-axis-text)' }}>
      {legendFormatter(value, t)}
    </span>
  )
}

export function SalesCostProfitChart({ data, height = 320 }: Props) {
  const { t } = useTranslation()

  const formatLegend = (value: string) => <LegendLabel value={value} t={t} />

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">{t('dashboard.charts.salesCostProfit')}</h3>
        <span className="chart-badge chart-badge--green">{t('dashboard.charts.composed')}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradCosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
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
          <Tooltip content={<ComposedTooltip />} />
          <Legend
            iconSize={10}
            formatter={formatLegend}
          />
          <Bar
            dataKey="sales"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            opacity={0.85}
          />
          <Area
            type="monotone"
            dataKey="costs"
            stroke="#34d399"
            strokeWidth={2}
            fill="url(#gradCosts)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="#fbbf24"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
