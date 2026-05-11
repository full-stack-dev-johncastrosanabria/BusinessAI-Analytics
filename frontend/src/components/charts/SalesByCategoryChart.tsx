import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import './charts.css'

export interface CategorySlice {
  readonly name: string
  readonly value: number
}

interface Props {
  readonly data: CategorySlice[]
  readonly height?: number
}

const DONUT_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#818cf8', '#4f46e5']

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const total = payload.reduce((sum, p) => sum + (p.value as number), 0) || 1
  const pct = (((entry.value as number) / total) * 100).toFixed(1)
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label" style={{ color: entry.payload?.fill }}>
        {entry.name}
      </p>
      <p className="chart-tooltip__row">
        <span className="chart-tooltip__name">{entry.name}:</span>
        <span className="chart-tooltip__value">
          ${(entry.value as number).toLocaleString()} ({pct}%) — {t('dashboard.charts.revenue')}
        </span>
      </p>
    </div>
  )
}

interface LabelProps {
  readonly cx: number
  readonly cy: number
  readonly midAngle: number
  readonly innerRadius: number
  readonly outerRadius: number
  readonly percent: number
}

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: LabelProps) {
  if (percent < 0.06) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function SalesByCategoryChart({ data, height = 280 }: Props) {
  const { t } = useTranslation()

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">{t('dashboard.charts.salesByCategory')}</h3>
        <span className="chart-badge chart-badge--violet">{t('dashboard.charts.distribution')}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 12, color: 'var(--chart-axis-text)' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}