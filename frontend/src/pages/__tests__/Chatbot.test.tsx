import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../i18n'
import Chatbot from '../Chatbot'

// Provide a fresh QueryClient for each test
function renderChatbot() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <Chatbot />
      </I18nextProvider>
    </QueryClientProvider>
  )
}

describe('Chatbot Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chatbot page with input field', () => {
    renderChatbot()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('displays the AI Business Assistant title', () => {
    renderChatbot()
    expect(screen.getByText(/AI Business Assistant/i)).toBeInTheDocument()
  })

  it('shows empty state with example questions when no messages', () => {
    renderChatbot()
    // The empty state hint text comes from i18n
    expect(screen.getByText(/example questions/i)).toBeInTheDocument()
  })

  it('shows language badge with current language indicator', () => {
    renderChatbot()
    // Language badge shows EN or ES
    const badge = screen.getByRole('button', { name: /switch to|cambiar/i })
    expect(badge).toBeInTheDocument()
  })

  it('toggles language when language badge is clicked', () => {
    renderChatbot()
    const badge = screen.getByRole('button', { name: /switch to english|cambiar a español/i })
    const initialText = badge.textContent
    fireEvent.click(badge)
    // After click the label should change
    expect(badge.textContent).not.toBe(initialText)
  })

  it('input has required attribute preventing empty submission', () => {
    renderChatbot()
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input).toBeRequired()
  })

  it('enables send button when input has text', () => {
    renderChatbot()
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'What are total sales?' } })
    const sendButton = document.querySelector('.chat-send-btn') as HTMLButtonElement
    expect(sendButton).not.toBeDisabled()
  })

  it('renders chat messages log region', () => {
    renderChatbot()
    expect(screen.getByRole('log')).toBeInTheDocument()
  })

  it('shows online status indicator', () => {
    renderChatbot()
    expect(screen.getByText(/online/i)).toBeInTheDocument()
  })
})
