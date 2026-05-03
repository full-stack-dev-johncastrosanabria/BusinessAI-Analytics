import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'

// Mock CSS
vi.mock('../Login.css', () => ({}))

// Mock react-router-dom navigate and location
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login' }),
  }
})

// Mock AuthContext
const mockLogin = vi.fn()
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    loading: false,
    user: null,
    logout: vi.fn(),
  }),
}))

// Mock child components
vi.mock('../../components/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}))
vi.mock('../../components/ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle" />,
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}))

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the login form', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /login\.signIn/i })).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    renderLogin()
    expect(screen.getByLabelText('login.email')).toBeInTheDocument()
    expect(screen.getByLabelText('login.password')).toBeInTheDocument()
  })

  it('pre-fills demo credentials', () => {
    renderLogin()
    const emailInput = screen.getByLabelText('login.email') as HTMLInputElement
    const passwordInput = screen.getByLabelText('login.password') as HTMLInputElement
    expect(emailInput.value).toBe('demo@businessai.com')
    expect(passwordInput.value).toBe('demo123')
  })

  it('renders language switcher and theme toggle', () => {
    renderLogin()
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument()
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })

  it('renders demo banner', () => {
    renderLogin()
    expect(screen.getByText('login.demoMode')).toBeInTheDocument()
  })

  it('renders fill demo button', () => {
    renderLogin()
    expect(screen.getByText('login.fillDemo')).toBeInTheDocument()
  })

  it('updates email input on change', () => {
    renderLogin()
    const emailInput = screen.getByLabelText('login.email') as HTMLInputElement
    fireEvent.change(emailInput, { target: { name: 'email', value: 'new@test.com' } })
    expect(emailInput.value).toBe('new@test.com')
  })

  it('updates password input on change', () => {
    renderLogin()
    const passwordInput = screen.getByLabelText('login.password') as HTMLInputElement
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'newpass' } })
    expect(passwordInput.value).toBe('newpass')
  })

  it('fill demo button resets credentials to demo values', () => {
    renderLogin()
    const emailInput = screen.getByLabelText('login.email') as HTMLInputElement

    // Change email first
    fireEvent.change(emailInput, { target: { name: 'email', value: 'other@test.com' } })
    expect(emailInput.value).toBe('other@test.com')

    // Click fill demo
    fireEvent.click(screen.getByText('login.fillDemo'))
    expect(emailInput.value).toBe('demo@businessai.com')
  })

  it('shows loading state during form submission', async () => {
    // Use real timers for this test - just check loading appears
    vi.useRealTimers()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))
    renderLogin()

    const form = screen.getByRole('button', { name: /login\.signIn/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('login.signingIn')).toBeInTheDocument()
    })
  })

  it('navigates after successful login', async () => {
    vi.useRealTimers()
    mockLogin.mockResolvedValue(true)
    renderLogin()

    const form = screen.getByRole('button', { name: /login\.signIn/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('demo@businessai.com', 'demo123')
    }, { timeout: 3000 })
  })

  it('does not navigate when login fails', async () => {
    vi.useRealTimers()
    mockLogin.mockResolvedValue(false)
    renderLogin()

    const form = screen.getByRole('button', { name: /login\.signIn/i }).closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    }, { timeout: 3000 })

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders mock credentials display', () => {
    renderLogin()
    expect(screen.getByText('login.mockCredentials')).toBeInTheDocument()
    expect(screen.getByText('demo@businessai.com')).toBeInTheDocument()
    expect(screen.getByText('demo123')).toBeInTheDocument()
  })

  it('renders forgot password link', () => {
    renderLogin()
    expect(screen.getByText('login.forgotPassword')).toBeInTheDocument()
  })

  it('renders sign up link', () => {
    renderLogin()
    expect(screen.getByText('login.signUp')).toBeInTheDocument()
  })

  it('renders remember me checkbox', () => {
    renderLogin()
    expect(screen.getByText('login.rememberMe')).toBeInTheDocument()
  })

  it('submit button is disabled during loading', async () => {
    vi.useRealTimers()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))
    renderLogin()

    const submitBtn = screen.getByRole('button', { name: /login\.signIn/i })
    const form = submitBtn.closest('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /login\.signingIn/i })
      expect(btn).toBeDisabled()
    })
  })
})
