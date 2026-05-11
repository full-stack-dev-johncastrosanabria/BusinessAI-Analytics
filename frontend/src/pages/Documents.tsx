import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import documentService, { type Document } from '../services/documentService'
import { DocumentPreviewModal } from '../components/DocumentPreviewModal'
import './Documents.css'

// ── helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(fileType?: string): string {
  switch (fileType?.toUpperCase()) {
    case 'PDF':  return '📄'
    case 'TXT':  return '📝'
    case 'DOCX':
    case 'DOC':  return '📃'
    case 'XLSX':
    case 'XLS':  return '📊'
    default:     return '📁'
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ALLOWED_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

// ── component ─────────────────────────────────────────────────────────────────

function Documents() {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await documentService.getDocuments()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t('documents.invalidFileType'))
      e.target.value = ''
      return
    }

    try {
      setUploading(true)
      setError(null)
      await documentService.uploadDocument(file)
      await fetchDocuments()
      e.target.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documents.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!globalThis.confirm(t('documents.deleteConfirm'))) return
    try {
      await documentService.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      if (previewDoc?.id === id) setPreviewDoc(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documents.deleteFailed'))
    }
  }

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="documents">
      {/* ── Page header ── */}
      <div className="documents__header">
        <div>
          <h1 className="documents__title">{t('documents.title')}</h1>
          <p className="documents__subtitle">
            {t('documents.subtitle', { count: documents.length })}
          </p>
        </div>

        {/* Upload button */}
        <button
          className="docs-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          type="button"
        >
          {uploading ? (
            <>
              <span className="docs-upload-btn__spinner" aria-hidden="true" />
              {t('documents.uploading')}
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16} aria-hidden="true">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
              {t('documents.uploadDocument')}
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".txt,.docx,.pdf,.xlsx"
          className="docs-file-input"
          aria-label={t('documents.chooseFile')}
        />
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="docs-error" role="alert">
          <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16} aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {error}
          <button className="docs-error__dismiss" onClick={() => setError(null)} type="button" aria-label={t('common.close')}>×</button>
        </div>
      )}

      {/* ── Search bar ── */}
      {documents.length > 0 && (
        <div className="docs-search">
          <svg className="docs-search__icon" viewBox="0 0 20 20" fill="currentColor" width={16} height={16} aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            className="docs-search__input"
            placeholder={t('documents.searchDocuments')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={t('documents.searchDocuments')}
          />
          {search && (
            <button className="docs-search__clear" onClick={() => setSearch('')} type="button" aria-label={t('common.close')}>×</button>
          )}
        </div>
      )}

      {/* ── States ── */}
      {loading && (
        <div className="docs-state">
          <span className="docs-state__spinner" aria-hidden="true" />
          <p>{t('documents.loading')}</p>
        </div>
      )}

      {!loading && documents.length === 0 && (
        <div className="docs-empty">
          <span className="docs-empty__icon" aria-hidden="true">📂</span>
          <p className="docs-empty__title">{t('documents.empty')}</p>
          <p className="docs-empty__hint">{t('documents.emptyHint')}</p>
          <button
            className="docs-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width={16} height={16} aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            {t('documents.uploadDocument')}
          </button>
        </div>
      )}

      {!loading && documents.length > 0 && filtered.length === 0 && (
        <div className="docs-state">
          <p>{t('common.noData')}</p>
        </div>
      )}

      {/* ── Document cards grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="docs-grid" role="list">
          {filtered.map((doc) => (
            <article key={doc.id} className="doc-card" role="listitem">
              {/* Card top */}
              <div className="doc-card__top">
                <span className="doc-card__icon" aria-hidden="true">{getFileIcon(doc.fileType)}</span>
                <span className={`doc-card__badge doc-card__badge--${doc.extractionStatus.toLowerCase()}`}>
                  {t(`documents.statuses.${doc.extractionStatus}`)}
                </span>
              </div>

              {/* Filename */}
              <h3 className="doc-card__name" title={doc.filename}>{doc.filename}</h3>

              {/* Meta */}
              <div className="doc-card__meta">
                <span>{doc.fileType}</span>
                <span className="doc-card__dot" aria-hidden="true">·</span>
                <span>{formatSize(doc.fileSize)}</span>
                <span className="doc-card__dot" aria-hidden="true">·</span>
                <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
              </div>

              {/* Extracted text snippet */}
              {doc.extractedText && (
                <p className="doc-card__snippet">
                  {doc.extractedText.slice(0, 120).trim()}…
                </p>
              )}

              {/* Actions */}
              <div className="doc-card__actions">
                <button
                  className="doc-card__btn doc-card__btn--preview"
                  onClick={() => setPreviewDoc(doc)}
                  type="button"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14} aria-hidden="true">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {t('documents.preview.open')}
                </button>
                <button
                  className="doc-card__btn doc-card__btn--delete"
                  onClick={() => handleDelete(doc.id)}
                  type="button"
                  aria-label={t('common.delete')}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14} aria-hidden="true">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                  </svg>
                  {t('common.delete')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Preview modal ── */}
      {previewDoc && (
        <DocumentPreviewModal
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  )
}

export default Documents
