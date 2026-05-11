import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import documentService, { Document } from '../services/documentService'
import './Documents.css'

function Documents() {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await documentService.getDocuments()
      setDocuments(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents')
      setDocuments([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type)) {
      setError(t('documents.invalidFileType'))
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
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('documents.deleteFailed'))
    }
  }

  return (
    <div className="documents">
      <h1>{t('documents.title')}</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="upload-section">
        <label htmlFor="file-input" className="upload-label">
          {uploading ? t('documents.uploading') : t('documents.chooseFile')}
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".txt,.docx,.pdf,.xlsx"
        />
      </div>

      {loading && <div className="loading">{t('documents.loading')}</div>}
      {!loading && documents.length === 0 && (
        <div className="empty">{t('documents.empty')}</div>
      )}
      {!loading && documents.length > 0 && (
        <div className="documents-list">
          <table>
            <thead>
              <tr>
                <th>{t('documents.fileName')}</th>
                <th>{t('documents.type')}</th>
                <th>{t('documents.size')}</th>
                <th>{t('documents.uploadDate')}</th>
                <th>{t('documents.status')}</th>
                <th>{t('documents.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.filename}</td>
                  <td>{doc.fileType}</td>
                  <td>{(doc.fileSize / 1024).toFixed(2)} KB</td>
                  <td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`status status-${doc.extractionStatus.toLowerCase()}`}>
                      {t(`documents.statuses.${doc.extractionStatus}`)}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(doc.id)} className="btn-delete">
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Documents
