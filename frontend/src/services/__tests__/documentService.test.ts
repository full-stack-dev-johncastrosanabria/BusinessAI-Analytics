import { describe, it, expect, vi, beforeEach } from 'vitest'
import documentService from '../documentService'
import { api } from '../../lib/api'

vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockDocument = {
  id: 1,
  filename: 'report.pdf',
  uploadDate: '2024-01-15',
  fileSize: 102400,
  fileType: 'application/pdf',
  extractionStatus: 'SUCCESS' as const,
}

describe('documentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getDocuments fetches all documents', async () => {
    vi.mocked(api.get).mockResolvedValue([mockDocument])
    const result = await documentService.getDocuments()
    expect(api.get).toHaveBeenCalledWith('/api/documents')
    expect(result).toEqual([mockDocument])
  })

  it('getDocument fetches document by id', async () => {
    vi.mocked(api.get).mockResolvedValue(mockDocument)
    const result = await documentService.getDocument(1)
    expect(api.get).toHaveBeenCalledWith('/api/documents/1')
    expect(result).toEqual(mockDocument)
  })

  it('getDocumentContent fetches document content', async () => {
    vi.mocked(api.get).mockResolvedValue({ content: 'Extracted text here' })
    const result = await documentService.getDocumentContent(1)
    expect(api.get).toHaveBeenCalledWith('/api/documents/1/content')
    expect(result).toEqual({ content: 'Extracted text here' })
  })

  it('uploadDocument posts file as FormData', async () => {
    vi.mocked(api.post).mockResolvedValue(mockDocument)
    const file = new File(['content'], 'report.pdf', { type: 'application/pdf' })
    const result = await documentService.uploadDocument(file)
    expect(api.post).toHaveBeenCalledWith(
      '/api/documents/upload',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    expect(result).toEqual(mockDocument)
  })

  it('deleteDocument deletes by id', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)
    await documentService.deleteDocument(1)
    expect(api.delete).toHaveBeenCalledWith('/api/documents/1')
  })

  it('getDocuments propagates errors', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Server error'))
    await expect(documentService.getDocuments()).rejects.toThrow('Server error')
  })
})
