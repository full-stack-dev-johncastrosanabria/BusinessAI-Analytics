import { Treemap, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts'
import { useTranslation } from 'react-i18next'
import './charts.css'

export interface TreemapNode {
  readonly name: string
  readonly value: number
  readonly category?: string
}

interface Props {
  readonly data: TreemapNode[]
  readonly height?: number
}

const TREEMAP_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#4f46e5',
  '#818cf8', '#c4b5fd', '#7c3aed', '#5b21b6',
]

interface ContentProps {
  readonly x?: number
  readonly y?: number
  readonly width?: number
  readonly height?: number
  readonly name?: string
  readonly value?: number
  readonly index?: number
}

function CustomContent({ x = 0, y = 0, width = 0, height = 0, name, value, index = 0 }: ContentProps) {
  const color = TREEMAP_COLORS[index % TREEMAP_COLORS.length]
  const showLabel = width > 60 && height > 36

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        rx={6}
        ry={6}
        fill={color}
        fillOpacity={0.88}
        stroke="var(--chart-treemap-border)"
        strokeWidth={1}
        style={{ transition: 'fill-opacity 0.2s ease' }}
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - (height > 60 ? 8 : 0)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={Math.min(13, Math.max(9, width / 8))}
            fontWeight={600}
            style={{ pointerEvents: 'none' }}
          >
            {name && name.length > 14 ? `${name.slice(0, 13)}…` : name}
          </text>
          {height > 60 && value !== undefined && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.75)"
              fontSize={10}
              style={{ pointerEvents: 'none' }}
            >
              ${value.toLocaleString()}
            </text>
          )}
        </>
      )}
    </g>
  )
}

function TreemapTooltip({ active, payload }: TooltipProps<number, string>) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{entry.name}</p>
      <p className="chart-tooltip__row">
        <span className="chart-tooltip__name">{t('dashboard.charts.revenue')}:</span>
        <span className="chart-tooltip__value">
          ${Number(entry.value).toLocaleString()}
        </span>
      </p>
    </div>
  )
}

export function ProductTreemapChart({ data, height = 320 }: Props) {
  const { t } = useTranslation()

  return (
    <div className="chart-wrapper">
      <div className="chart-header">
        <h3 className="chart-title">{t('dashboard.charts.productDistribution')}</h3>
        <span className="chart-badge chart-badge--amber">{t('dashboard.charts.byRevenue')}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          content={<CustomContent />}
          animationBegin={0}
          animationDuration={600}
        >
          <Tooltip content={<TreemapTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  )
}
