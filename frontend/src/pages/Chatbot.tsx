import { useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useChatbot, useChatForm } from '../hooks/useChatbot'
import './Chatbot.css'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Sending...' : 'Send'}
    </button>
  )
}

function Chatbot() {
  const { messages, isLoading } = useChatbot()
  const { formAction, error } = useChatForm()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chatbot">
      <h1>AI Business Assistant</h1>

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <p>Ask me anything about your business data!</p>
              <p className="hint">
                Try: "What were the top products last month?" or "Show me revenue
                trends"
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="message-group">
                <div className="message user-message">
                  <div className="message-content">{message.question}</div>
                </div>
                <div className="message assistant-message">
                  <div className="message-content">
                    {message.answer}
                    {message.processingTime && (
                      <div className="message-meta">
                        Processed in {message.processingTime.toFixed(2)}s
                      </div>
                    )}
                  </div>
                  {message.sources.length > 0 && (
                    <div className="message-sources">
                      <strong>Sources:</strong>
                      <ul>
                        {message.sources.map((source, idx) => (
                          <li key={idx}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant-message">
              <div className="message-content typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          ref={formRef}
          action={formAction}
          className="chat-input-form"
          onSubmit={() => {
            // Reset form after submission
            setTimeout(() => formRef.current?.reset(), 0)
          }}
        >
          {error && <div className="error-message">{error}</div>}
          <div className="input-group">
            <input
              type="text"
              name="question"
              placeholder="Ask a question..."
              className="chat-input"
              autoComplete="off"
              required
            />
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}

export default Chatbot
