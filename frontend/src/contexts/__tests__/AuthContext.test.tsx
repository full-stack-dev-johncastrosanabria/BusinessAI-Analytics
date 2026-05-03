import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

// Mock localStorage for this test file
const localStorageData: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageData[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageData[key] = value }),
  removeItem: vi.fn((key: string) => { delete localStorageData[key] }),
  clear: vi.fn(() => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]) }),
}

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
})

// Helper component to expose auth context
function AuthConsumer() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user ? auth.user.email : 'null'}</span>
      <button onClick={() => auth.login('test@test.com', 'pass')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all stored data
    Object.keys(localStorageData).forEach(k => delete localStorageData[k])
    mockLocalStorage.getItem.mockImplementation((key: string) => localStorageData[key] ?? null)
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => { localStorageData[key] = value })
    mockLocalStorage.removeItem.mockImplementation((key: string) => { delete localStorageData[key] })
    vi.clearAllMocks()
    // Re-setup mocks after clearAllMocks
    mockLocalStorage.getItem.mockImplementation((key: string) => localStorageData[key] ?? null)
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => { localStorageData[key] = value })
    mockLocalStorage.removeItem.mockImplementation((key: string) => { delete localStorageData[key] })
  })

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<AuthConsumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    )
    consoleSpy.mockRestore()
  })

  it('starts with loading=true then loading=false', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })

  it('starts unauthenticated when no stored auth', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('false')
      expect(screen.getByTestId('user').textContent).toBe('null')
    })
  })

  it('restores auth state from localStorage', async () => {
    localStorageData['isAuthenticated'] = 'true'
    localStorageData['user'] = JSON.stringify({ name: 'John', email: 'john@test.com', role: 'admin' })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
      expect(screen.getByTestId('user').textContent).toBe('john@test.com')
    })
  })

  it('clears invalid localStorage data', async () => {
    localStorageData['isAuthenticated'] = 'true'
    localStorageData['user'] = 'invalid-json{{{'

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      // loading should be false after initialization
      expect(screen.getByTestId('loading').textContent).toBe('false')
      // localStorage keys should be removed
      expect(localStorageData['isAuthenticated']).toBeUndefined()
    })
  })

  it('login sets authenticated state and stores in localStorage', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })

    await act(async () => {
      screen.getByText('Login').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
      expect(screen.getByTestId('user').textContent).toBe('test@test.com')
      expect(localStorageData['isAuthenticated']).toBe('true')
    })
  })

  it('login returns true on success', async () => {
    let loginResult: boolean | undefined

    function LoginTester() {
      const { login } = useAuth()
      return (
        <button
          onClick={async () => {
            loginResult = await login('a@b.com', 'pass')
          }}
        >
          Test Login
        </button>
      )
    }

    render(
      <AuthProvider>
        <LoginTester />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByText('Test Login').click()
    })

    expect(loginResult).toBe(true)
  })

  it('logout clears auth state and localStorage', async () => {
    localStorageData['isAuthenticated'] = 'true'
    localStorageData['user'] = JSON.stringify({ name: 'John', email: 'john@test.com', role: 'admin' })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated').textContent).toBe('true')
    })

    await act(async () => {
      screen.getByText('Logout').click()
    })

    expect(screen.getByTestId('authenticated').textContent).toBe('false')
    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(localStorageData['isAuthenticated']).toBeUndefined()
    expect(localStorageData['user']).toBeUndefined()
  })

  it('renders children', async () => {
    render(
      <AuthProvider>
        <div data-testid="child">Child Content</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
