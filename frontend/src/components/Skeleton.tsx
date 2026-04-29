import './Skeleton.css'

interface SkeletonProps {
  /** Width of the skeleton element (default: '100%') */
  width?: string | number
  /** Height of the skeleton element (default: '1em') */
  height?: string | number
  /** Border radius variant */
  variant?: 'text' | 'rect' | 'circle'
  /** Extra class names */
  className?: string
}

/**
 * Skeleton – animated placeholder shown while content is loading.
 * Validates: Requirements 3.8 (elegant loading animations and skeleton screens)
 */
export function Skeleton({ width = '100%', height = '1em', variant = 'rect', className = '' }: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <span
      className={`skeleton skeleton--${variant} ${className}`.trim()}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  )
}

/** Convenience: a row of skeleton lines mimicking a text block */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-text-block" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '70%' : '100%'}
          height="0.9em"
        />
      ))}
    </div>
  )
}

/** Convenience: skeleton card matching .metric-card dimensions */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton-card ${className}`.trim()} aria-hidden="true">
      <Skeleton variant="text" width="60%" height="0.8em" />
      <Skeleton variant="text" width="80%" height="1.8rem" />
      <Skeleton variant="text" width="50%" height="0.8em" />
    </div>
  )
}

/** Convenience: skeleton table rows */
export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="skeleton-table" aria-hidden="true" role="presentation">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} variant="text" height="0.9em" />
          ))}
        </div>
      ))}
    </div>
  )
}
