import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Documents from '../Documents'
import * as documentService from '../../services/documentService'

vi.mock('../../services/documentService')

const mockDocuments = [
  {
    id: 1,
    filename: 'report.pdf',
    uploadDate: '2024-01-15T10:00:00Z',
    fileSize: 102400,
    fileType: 'application/pdf',
    extractionStatus: 'SUCCESS' as const,
  },
  {
    id: 2,
    filename: 'data.xlsx',
    uploadDate: '2024-01-16T11:00:00Z',
    fileSize: 51200,
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extractionStatus: 'PENDING' as const,
  },
]

describe('Documents Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays loading state initially', () => {
    vi.mocked(documentService.default.getDocuments).mockReturnValue(new Promise(() => {}))

    render(<Documents />)

    expect(screen.getByText(/Loading documents/i)).toBeInTheDocument()
  })

  it('renders document list after loading', async () => {
    vi.mocked(documentService.default.getDocuments).mockResolvedValue(mockDocuments)

    render(<Documents />)

    await waitFor(() => {
      expect(screen.getByText('report.pdf')).toBeInTheDocument()
      expect(screen.getByText('data.xlsx')).toBeInTheDocument()
    })
  })

  it('displays extraction status for each document', async () => {
    vi.mocked(documentService.default.getDocuments).mockResolvedValue(mockDocuments)

    render(<Documents />)

    await waitFor(() => {
      expect(screen.getByText('SUCCESS')).toBeInTheDocument()
      expect(screen.getByText('PENDING')).toBeInTheDocument()
    })
  })

  it('shows empty state when no documents', async () => {
    vi.mocked(documentService.default.getDocuments).mockResolvedValue([])

    render(<Documents />)

    await waitFor(() => {
      expect(screen.getByText(/No documents uploaded yet/i)).toBeInTheDocument()
    })
  })

  it('displays file upload input', async () => {
    vi.mocked(documentService.default.getDocuments).mockResolvedValue([])

    render(<Documents />)

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
    })
  })

  it('shows error for invalid file type', async () => {
    vi.mocked(documentService.default.getDocuments).mockResolvedValue([])

    render(<Documents />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading documents/i)).not.toBeInTheDocument()
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const invalidFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })

    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      configurable: true,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument()
    })
  })

  it('displays error message on load failure', async () => {
    vi.mocked(documentService.default.getDocuments).mockRejectedValue(
      new Error('Failed to load documents')
    )

    render(<Documents />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load documents/i)).toBeInTheDocument()
    })
  })

  it('shows uploading state during file upload', async () => {
    vi.mocked(documentService.default.getDocuments).mockResolvedValue([])
    vi.mocked(documentService.default.uploadDocument).mockReturnValue(new Promise(() => {}))

    render(<Documents />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading documents/i)).not.toBeInTheDocument()
    })

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      configurable: true,
    })

    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(screen.getByText(/Uploading/i)).toBeInTheDocument()
    })
  })

  it('displays document table headers', async () => {
    vi.mocked(documentService.default.getDocuments).mockResolvedValue(mockDocuments)

    render(<Documents />)

    await waitFor(() => {
      expect(screen.getByText('Filename')).toBeInTheDocument()
      expect(screen.getByText('Type')).toBeInTheDocument()
      expect(screen.getByText('Size')).toBeInTheDocument()
      expect(screen.getByText('Upload Date')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })
})
