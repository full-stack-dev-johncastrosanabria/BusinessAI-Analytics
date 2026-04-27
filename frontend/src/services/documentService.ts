import { api } from '../lib/api'

export interface Document {
  id: number
  filename: string
  uploadDate: string
  fileSize: number
  fileType: string
  extractedText?: string
  extractionStatus: 'PENDING' | 'SUCCESS' | 'FAILED'
  errorMessage?: string
}

const documentService = {
  // Get all documents
  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/api/documents')
  },

  // Get document by ID
  getDocument: async (id: number): Promise<Document> => {
    const response = await api.get(`/api/documents/${id}`)
  },

  // Get document content (extracted text)
  getDocumentContent: async (id: number): Promise<{ content: string }> => {
    const response = await api.get(`/api/documents/${id}/content`)
  },

  // Upload document
  uploadDocument: async (file: File): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  // Delete document
  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/api/documents/${id}`)
  },
}

export default documentService
