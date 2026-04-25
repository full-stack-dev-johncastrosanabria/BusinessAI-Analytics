import api from './api'

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
    return response.data
  },

  // Get document by ID
  getDocument: async (id: number): Promise<Document> => {
    const response = await api.get(`/api/documents/${id}`)
    return response.data
  },

  // Get document content (extracted text)
  getDocumentContent: async (id: number): Promise<{ content: string }> => {
    const response = await api.get(`/api/documents/${id}/content`)
    return response.data
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
    return response.data
  },

  // Delete document
  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/api/documents/${id}`)
  },
}

export default documentService
