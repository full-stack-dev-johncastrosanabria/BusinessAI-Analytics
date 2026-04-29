import { useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useChatbot, useChatForm } from '../hooks/useChatbot'
import './Chatbot.css'

function SubmitButton() {
  const { pending } = useFormStatus()
  const { t } = useTranslation()

  return (
    <button type="submit" disabled={pending} className="chat-send-btn" aria-label={t('chatbot.send')}>
      {pending ? (
        <span className="chat-send-btn__spinner" aria-hidden="true" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      )}
    </button>
  )
}

function LanguageBadge() {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('es') ? 'en' : 'es')
  }

  const label = i18n.language.startsWith('es') ? 'ES' : 'EN'
  const nextLabel = i18n.language.startsWith('es') ? 'Switch to English' : 'Cambiar a Español'

  return (
    <button
      className="chat-lang-badge"
      onClick={toggleLanguage}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <span className="chat-lang-badge__dot" aria-hidden="true" />
      {label}
    </button>
  )
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Chatbot() {
  const { messages, isLoading } = useChatbot()
  const { formAction, error } = useChatForm()
  const { t } = useTranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chatbot">
      <div className="chatbot__header">
        <div className="chatbot__header-left">
          <div className="chatbot__avatar" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M16.5 7.5h-9v9h9v-9z" />
              <path fillRule="evenodd" d="M8.25 2.25A.75.75 0 019 3v.75h2.25V3a.75.75 0 011.5 0v.75H15V3a.75.75 0 011.5 0v.75h.75a3 3 0 013 3v.75H21A.75.75 0 0121 9h-.75v2.25H21a.75.75 0 010 1.5h-.75V15H21a.75.75 0 010 1.5h-.75v.75a3 3 0 01-3 3h-.75V21a.75.75 0 01-1.5 0v-.75h-2.25V21a.75.75 0 01-1.5 0v-.75H9V21a.75.75 0 01-1.5 0v-.75h-.75a3 3 0 01-3-3v-.75H3A.75.75 0 013 15h.75v-2.25H3a.75.75 0 010-1.5h.75V9H3a.75.75 0 010-1.5h.75v-.75a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM6 6.75A.75.75 0 016.75 6h10.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V6.75z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="chatbot__title">{t('chatbot.title')}</h1>
            <span className="chatbot__status">
              <span className="chatbot__status-dot" aria-hidden="true" />
              Online
            </span>
          </div>
        </div>
        <LanguageBadge />
      </div>

      <div className="chat-container">
        <div className="messages" role="log" aria-live="polite" aria-label="Chat messages">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" aria-hidden="true">💬</div>
              <p className="empty-state__title">{t('chatbot.askQuestion')}</p>
              <p className="empty-state__hint">{t('chatbot.examples')}</p>
              <div className="empty-state__suggestions">
                {(['example1', 'example2', 'example3', 'example4'] as const).map((key) => (
                  <span key={key} className="suggestion-chip">{t(`chatbot.${key}`)}</span>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="message-group">
                {/* User message */}
                <div className="message-row message-row--user">
                  <div className="message message--user">
                    <div className="message__bubble">{message.question}</div>
                    <time className="message__time" dateTime={new Date(message.timestamp).toISOString()}>
                      {formatTimestamp(message.timestamp)}
                    </time>
                  </div>
                </div>

                {/* Bot message */}
                <div className="message-row message-row--bot">
                  <div className="message-bot-avatar" aria-hidden="true">AI</div>
                  <div className="message message--bot">
                    <div className="message__bubble">
                      {message.answer}
                      {message.processingTime && (
                        <div className="message__meta">
                          ⚡ {message.processingTime.toFixed(2)}s
                        </div>
                      )}
                    </div>
                    <time className="message__time" dateTime={new Date(message.timestamp).toISOString()}>
                      {formatTimestamp(message.timestamp)}
                    </time>
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
              </div>
            ))
          )}

          {isLoading && (
            <div className="message-row message-row--bot" aria-label={t('chatbot.typing')}>
              <div className="message-bot-avatar" aria-hidden="true">AI</div>
              <div className="message message--bot">
                <div className="message__bubble message__bubble--typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
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
            setTimeout(() => formRef.current?.reset(), 0)
          }}
        >
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
          <div className="input-group">
            <input
              type="text"
              name="question"
              placeholder={t('chatbot.askQuestion')}
              className="chat-input"
              autoComplete="off"
              required
              aria-label={t('chatbot.askQuestion')}
            />
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}

export default Chatbot
