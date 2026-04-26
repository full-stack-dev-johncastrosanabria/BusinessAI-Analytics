import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Chatbot from '../Chatbot'
import * as aiService from '../../services/aiService'

vi.mock('../../services/aiService')

const mockChatbotResponse = {
  question: 'What are total sales?',
  answer: 'Total sales for the period are $100,000.',
  sources: [],
  processingTime: 0.5,
}

describe('Chatbot Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chatbot page with input field', () => {
    render(<Chatbot />)

    expect(screen.getByPlaceholderText(/Ask a question/i)).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()
  })

  it('displays welcome message initially', () => {
    render(<Chatbot />)

    expect(screen.getByText(/Welcome to BusinessAI Chatbot/i)).toBeInTheDocument()
  })

  it('sends a message and displays user message in conversation', async () => {
    vi.mocked(aiService.default.processChatbotQuery).mockResolvedValue(mockChatbotResponse)

    render(<Chatbot />)

    const input = screen.getByPlaceholderText(/Ask a question/i)
    fireEvent.change(input, { target: { value: 'What are total sales?' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText('What are total sales?')).toBeInTheDocument()
    })
  })

  it('displays bot response after sending message', async () => {
    vi.mocked(aiService.default.processChatbotQuery).mockResolvedValue(mockChatbotResponse)

    render(<Chatbot />)

    const input = screen.getByPlaceholderText(/Ask a question/i)
    fireEvent.change(input, { target: { value: 'What are total sales?' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText('Total sales for the period are $100,000.')).toBeInTheDocument()
    })
  })

  it('clears input after sending message', async () => {
    vi.mocked(aiService.default.processChatbotQuery).mockResolvedValue(mockChatbotResponse)

    render(<Chatbot />)

    const input = screen.getByPlaceholderText(/Ask a question/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'What are total sales?' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('shows loading indicator while processing query', async () => {
    vi.mocked(aiService.default.processChatbotQuery).mockReturnValue(new Promise(() => {}))

    render(<Chatbot />)

    const input = screen.getByPlaceholderText(/Ask a question/i)
    fireEvent.change(input, { target: { value: 'What are total sales?' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument()
    })
  })

  it('disables send button when input is empty', () => {
    render(<Chatbot />)

    const sendButton = screen.getByText('Send')
    expect(sendButton).toBeDisabled()
  })

  it('displays error message in chat on query failure', async () => {
    vi.mocked(aiService.default.processChatbotQuery).mockRejectedValue(
      new Error('Failed to process query')
    )

    render(<Chatbot />)

    const input = screen.getByPlaceholderText(/Ask a question/i)
    fireEvent.change(input, { target: { value: 'What are total sales?' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/i)).toBeInTheDocument()
    })
  })

  it('calls processChatbotQuery with the question', async () => {
    vi.mocked(aiService.default.processChatbotQuery).mockResolvedValue(mockChatbotResponse)

    render(<Chatbot />)

    const input = screen.getByPlaceholderText(/Ask a question/i)
    fireEvent.change(input, { target: { value: 'What are total sales?' } })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(aiService.default.processChatbotQuery).toHaveBeenCalledWith({
        question: 'What are total sales?',
      })
    })
  })

  it('does not send empty messages', () => {
    render(<Chatbot />)

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    expect(aiService.default.processChatbotQuery).not.toHaveBeenCalled()
  })
})
