import { useEffect, useRef, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Document } from '../services/documentService'
import './DocumentPreviewModal.css'

interface Props {
  readonly doc: Document
  readonly onClose: () => void
}

type PreviewState =
  | { status: 'loading' }
  | { status: 'pdf'; objectUrl: string; pageCount: number }
  | { status: 'text'; content: string }
  | { status: 'unsupported' }
  | { status: 'error'; message: string }

const STATIC_DOCUMENTS_KEY = 'businessai.static.documents'

interface StoredDoc {
  readonly id: number
  readonly extractedText?: string
}

function getStoredText(id: number): string | null {
  try {
    const raw = globalThis.localStorage?.getItem(STATIC_DOCUMENTS_KEY)
    if (!raw) return null
    const docs = JSON.parse(raw) as StoredDoc[]
    return docs.find((d) => d.id === id)?.extractedText ?? null
  } catch {
    return null
  }
}

export function DocumentPreviewModal({ doc, onClose }: Props) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState<PreviewState>({ status: 'loading' })
  const objectUrlRef = useRef<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Trap focus inside modal
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    overlayRef.current?.focus()
    return () => prev?.focus()
  }, [])

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  // Build preview from extractedText (already stored) or show unsupported
  useEffect(() => {
    const fileType = doc.fileType?.toUpperCase() ?? ''

    // Try extractedText from the document object first, then localStorage
    const text = doc.extractedText?.trim() || getStoredText(doc.id)?.trim() || ''

    if (fileType === 'PDF') {
      if (text) {
        // We have extracted text — show it as readable text preview
        setPreview({ status: 'text', content: text })
      } else {
        // No text extracted (encrypted / binary-only PDF)
        setPreview({ status: 'unsupported' })
      }
      return
    }

    if (fileType === 'TXT' || doc.filename.endsWith('.txt')) {
      if (text) {
        setPreview({ status: 'text', content: text })
      } else {
        setPreview({ status: 'unsupported' })
      }
      return
    }

    // DOCX / XLSX — no client-side rendering available
    setPreview({ status: 'unsupported' })
  }, [doc])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose]
  )

  const fileIcon = getFileIcon(doc.fileType)
  const fileSizeKb = (doc.fileSize / 1024).toFixed(1)

  return (
    <div
      className="doc-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('documents.preview.title', { name: doc.filename })}
      tabIndex={-1}
    >
      <div className="doc-modal">
        {/* Header */}
        <div className="doc-modal__header">
          <div className="doc-modal__header-left">
            <span className="doc-modal__icon" aria-hidden="true">{fileIcon}</span>
            <div className="doc-modal__meta">
              <h2 className="doc-modal__filename">{doc.filename}</h2>
              <p className="doc-modal__info">
                {doc.fileType} · {fileSizeKb} KB ·{' '}
                {new Date(doc.uploadDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            className="doc-modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="doc-modal__body">
          {preview.status === 'loading' && (
            <div className="doc-preview-state">
              <span className="doc-preview-spinner" aria-hidden="true" />
              <p>{t('common.loading')}</p>
            </div>
          )}

          {preview.status === 'text' && (
            <pre className="doc-preview-text">{preview.content}</pre>
          )}

          {preview.status === 'unsupported' && (
            <div className="doc-preview-state doc-preview-state--unsupported">
              <span className="doc-preview-state__icon" aria-hidden="true">{fileIcon}</span>
              <p className="doc-preview-state__title">
                {t('documents.preview.noPreview')}
              </p>
              <p className="doc-preview-state__hint">
                {t('documents.preview.noPreviewHint', { type: doc.fileType })}
              </p>
            </div>
          )}

          {preview.status === 'error' && (
            <div className="doc-preview-state doc-preview-state--error">
              <p>{preview.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getFileIcon(fileType?: string): string {
  switch (fileType?.toUpperCase()) {
    case 'PDF': return '📄'
    case 'TXT': return '📝'
    case 'DOCX':
    case 'DOC': return '📃'
    case 'XLSX':
    case 'XLS': return '📊'
    default: return '📁'
  }
}
