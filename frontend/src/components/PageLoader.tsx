import './PageLoader.css'

interface PageLoaderProps {
  /** Optional label shown below the spinner */
  readonly label?: string
  /** Size variant */
  readonly size?: 'sm' | 'md' | 'lg'
  /** Fill the full viewport height */
  readonly fullPage?: boolean
}

/**
 * PageLoader – animated spinner / progress indicator for page-level loading.
 * Validates: Requirements 3.4, 3.8
 */
export function PageLoader({ label, size = 'md', fullPage = false }: PageLoaderProps) {
  return (
    <div
      className={`page-loader${fullPage ? ' page-loader--full' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading…'}
    >
      <span className={`page-loader__spinner page-loader__spinner--${size}`} aria-hidden="true" />
      {label && <span className="page-loader__label">{label}</span>}
    </div>
  )
}

/** Inline spinner – small, embeddable in buttons or inline contexts */
export function LoadingSpinner({ size = 'sm', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  return (
    <span
      className={`loading-spinner loading-spinner--${size}`}
      role="status"
      aria-label={label ?? 'Loading'}
      aria-hidden={!label}
    />
  )
}
