import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

// Style constants
const ERROR_CONTAINER_MIN_HEIGHT = '100vh'
const ERROR_CONTAINER_PADDING = '2rem'
const ERROR_TITLE_FONT_SIZE = '4rem'
const ERROR_DESCRIPTION_MAX_WIDTH = '500px'
const ERROR_DESCRIPTION_COLOR = '#666'
const BUTTON_MARGIN_TOP = '2rem'
const BUTTON_PADDING = '0.75rem 1.5rem'
const BUTTON_FONT_SIZE = '1rem'
const BUTTON_BG_COLOR = '#007bff'
const BUTTON_BORDER_RADIUS = '4px'
const SECTION_MARGIN_TOP = '1rem'

export default function ErrorBoundary() {
  const error = useRouteError()

  let errorMessage: string
  let errorStatus: number | undefined

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data?.message || error.statusText
    errorStatus = error.status
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else {
    errorMessage = 'An unexpected error occurred'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: ERROR_CONTAINER_MIN_HEIGHT,
      padding: ERROR_CONTAINER_PADDING,
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: ERROR_TITLE_FONT_SIZE, margin: 0 }}>
        {errorStatus || '⚠️'}
      </h1>
      <h2 style={{ marginTop: SECTION_MARGIN_TOP }}>Oops! Something went wrong</h2>
      <p style={{ 
        color: ERROR_DESCRIPTION_COLOR, 
        maxWidth: ERROR_DESCRIPTION_MAX_WIDTH, 
        marginTop: SECTION_MARGIN_TOP 
      }}>
        {errorMessage}
      </p>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: BUTTON_MARGIN_TOP,
          padding: BUTTON_PADDING,
          fontSize: BUTTON_FONT_SIZE,
          backgroundColor: BUTTON_BG_COLOR,
          color: 'white',
          border: 'none',
          borderRadius: BUTTON_BORDER_RADIUS,
          cursor: 'pointer',
        }}
      >
        Go Home
      </button>
    </div>
  )
}
