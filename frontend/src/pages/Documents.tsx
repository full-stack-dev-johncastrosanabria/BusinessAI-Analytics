import { useState, useEffect } from 'react'
import documentService, { Document } from '../services/documentService'
import './Documents.css'

function Documents() {
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
      setError('Invalid file type. Allowed: TXT, DOCX, PDF, XLSX')
      return
    }

    try {
      setUploading(true)
      setError(null)
      await documentService.uploadDocument(file)
      await fetchDocuments()
      e.target.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return
    try {
      await documentService.deleteDocument(id)
      await fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document')
    }
  }

  return (
    <div className="documents">
      <h1>Documents</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="upload-section">
        <label htmlFor="file-input" className="upload-label">
          {uploading ? 'Uploading...' : 'Choose File (TXT, DOCX, PDF, XLSX)'}
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          accept=".txt,.docx,.pdf,.xlsx"
        />
      </div>

      {loading ? (
        <div className="loading">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="empty">No documents uploaded yet</div>
      ) : (
        <div className="documents-list">
          <table>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Type</th>
                <th>Size</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Actions</th>
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
                      {doc.extractionStatus}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(doc.id)} className="btn-delete">
                      Delete
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
