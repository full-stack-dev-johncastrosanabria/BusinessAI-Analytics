import { useRouteError, isRouteErrorResponse } from 'react-router-dom'

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
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>
        {errorStatus || '⚠️'}
      </h1>
      <h2 style={{ marginTop: '1rem' }}>Oops! Something went wrong</h2>
      <p style={{ color: '#666', maxWidth: '500px', marginTop: '1rem' }}>
        {errorMessage}
      </p>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Go Home
      </button>
    </div>
  )
}
