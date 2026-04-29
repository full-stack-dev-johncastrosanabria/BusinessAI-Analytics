import { useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  type TooltipProps,
} from 'recharts'
import './InteractiveChart.css'

export type ChartType = 'line' | 'bar'

export interface ChartSeries {
  dataKey: string
  color: string
  name?: string
}

export interface InteractiveChartProps {
  data: Record<string, unknown>[]
  series: ChartSeries[]
  xDataKey: string
  chartType?: ChartType
  height?: number
  title?: string
  onDataPointClick?: (dataKey: string, value: unknown, entry: Record<string, unknown>) => void
  onExportCSV?: () => void
  onExportJSON?: () => void
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="ic-tooltip" role="tooltip">
      <p className="ic-tooltip__label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="ic-tooltip__row" style={{ color: entry.color }}>
          <span className="ic-tooltip__name">{entry.name}:</span>
          <span className="ic-tooltip__value">
            {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </span>
        </p>
      ))}
    </div>
  )
}

export function InteractiveChart({
  data,
  series,
  xDataKey,
  chartType = 'line',
  height = 300,
  title,
  onDataPointClick,
  onExportCSV,
  onExportJSON,
}: InteractiveChartProps) {
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null)
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [zoomDomain, setZoomDomain] = useState<{ left: string; right: string } | null>(null)

  const displayData = zoomDomain
    ? data.filter((d) => {
        const x = String(d[xDataKey])
        return x >= zoomDomain.left && x <= zoomDomain.right
      })
    : data

  const handleMouseDown = useCallback((e: { activeLabel?: string }) => {
    if (e?.activeLabel) {
      setRefAreaLeft(e.activeLabel)
      setIsSelecting(true)
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: { activeLabel?: string }) => {
      if (isSelecting && e?.activeLabel) {
        setRefAreaRight(e.activeLabel)
      }
    },
    [isSelecting]
  )

  const handleMouseUp = useCallback(() => {
    if (refAreaLeft && refAreaRight && refAreaLeft !== refAreaRight) {
      const [left, right] =
        refAreaLeft < refAreaRight
          ? [refAreaLeft, refAreaRight]
          : [refAreaRight, refAreaLeft]
      setZoomDomain({ left, right })
    }
    setRefAreaLeft(null)
    setRefAreaRight(null)
    setIsSelecting(false)
  }, [refAreaLeft, refAreaRight])

  const handleReset = useCallback(() => {
    setZoomDomain(null)
    setRefAreaLeft(null)
    setRefAreaRight(null)
    setIsSelecting(false)
  }, [])

  const handleClick = useCallback(
    (entry: Record<string, unknown>, dataKey: string) => {
      if (onDataPointClick) {
        onDataPointClick(dataKey, entry[dataKey], entry)
      }
    },
    [onDataPointClick]
  )

  const commonProps = {
    data: displayData,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  }

  return (
    <div className="ic-wrapper">
      {(title || onExportCSV || onExportJSON || zoomDomain) && (
        <div className="ic-header">
          {title && <h2 className="ic-title">{title}</h2>}
          <div className="ic-actions">
            {zoomDomain && (
              <button
                className="ic-btn ic-btn--reset"
                onClick={handleReset}
                aria-label="Reset zoom"
              >
                Reset zoom
              </button>
            )}
            {onExportCSV && (
              <button
                className="ic-btn ic-btn--export"
                onClick={onExportCSV}
                aria-label="Export as CSV"
              >
                ↓ CSV
              </button>
            )}
            {onExportJSON && (
              <button
                className="ic-btn ic-btn--export"
                onClick={onExportJSON}
                aria-label="Export as JSON"
              >
                ↓ JSON
              </button>
            )}
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xDataKey} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                fill={s.color}
                name={s.name ?? s.dataKey}
                onClick={(entry) => handleClick(entry as Record<string, unknown>, s.dataKey)}
                style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
              />
            ))}
            {isSelecting && refAreaLeft && refAreaRight && (
              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
            )}
          </BarChart>
        ) : (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xDataKey} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {series.map((s) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                stroke={s.color}
                name={s.name ?? s.dataKey}
                dot={{ r: 3 }}
                activeDot={{
                  r: 6,
                  onClick: (_event, payload) => {
                    const p = payload as { payload?: Record<string, unknown> }
                    if (p?.payload) handleClick(p.payload, s.dataKey)
                  },
                  style: { cursor: onDataPointClick ? 'pointer' : 'default' },
                }}
              />
            ))}
            {isSelecting && refAreaLeft && refAreaRight && (
              <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>

      {zoomDomain && (
        <p className="ic-zoom-hint">
          Showing {displayData.length} of {data.length} data points — drag to zoom, click Reset to restore
        </p>
      )}
      {!zoomDomain && data.length > 1 && (
        <p className="ic-zoom-hint">Drag on the chart to zoom into a range</p>
      )}
    </div>
  )
}
