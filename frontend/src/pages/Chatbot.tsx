import { useState, useRef, useEffect } from 'react'
import aiService, { ChatbotResponse } from '../services/aiService'
import './Chatbot.css'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
}

function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await aiService.processChatbotQuery({ question: input })
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.answer,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process query')
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chatbot">
      <h1>Chatbot</h1>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>Welcome to BusinessAI Chatbot</h2>
              <p>Ask me questions about your business data, products, customers, or documents.</p>
              <p>Examples:</p>
              <ul>
                <li>"What were the total sales in January 2024?"</li>
                <li>"Show me the top products by revenue"</li>
                <li>"What information do we have about customer segments?"</li>
                <li>"Search for information about marketing strategies"</li>
              </ul>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message message-${message.type}`}>
              <div className="message-content">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message message-bot">
              <div className="message-content loading-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="input-form">
          {error && <div className="error-message">{error}</div>}
          <div className="input-group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={loading}
              className="message-input"
            />
            <button type="submit" disabled={loading || !input.trim()} className="send-button">
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Chatbot
