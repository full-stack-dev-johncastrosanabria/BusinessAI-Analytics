import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Customers from '../Customers'
import * as customerService from '../../services/customerService'

vi.mock('../../services/customerService')

const mockCustomers = [
  { id: 1, name: 'Alice Smith', email: 'alice@example.com', segment: 'Premium', country: 'USA' },
  { id: 2, name: 'Bob Jones', email: 'bob@example.com', segment: 'Standard', country: 'UK' },
]

describe('Customers Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays loading state initially', () => {
    vi.mocked(customerService.default.getCustomers).mockReturnValue(new Promise(() => {}))

    render(<Customers />)

    // Loading state uses aria-label="Loading customers" on the container div
    expect(screen.getByLabelText(/Loading customers/i)).toBeInTheDocument()
  })

  it('renders customer table after loading', async () => {
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Customers />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    })
  })

  it('displays form fields for creating customers', async () => {
    vi.mocked(customerService.default.getCustomers).mockResolvedValue([])

    render(<Customers />)

    await waitFor(() => {
      expect(screen.queryByLabelText(/Loading customers/i)).not.toBeInTheDocument()
    })

    // Use getAllByText since labels may appear in table headers too
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Email').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Segment').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Country').length).toBeGreaterThan(0)
  })

  it('validates email format and shows error for invalid email', async () => {
    vi.mocked(customerService.default.getCustomers).mockResolvedValue([])

    render(<Customers />)

    await waitFor(() => {
      expect(screen.queryByLabelText(/Loading customers/i)).not.toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input')
    const nameInput = inputs[0]
    const emailInput = inputs[1]
    const segmentInput = inputs[2]
    const countryInput = inputs[3]

    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(emailInput, { target: { value: 'notanemail' } })
    fireEvent.change(segmentInput, { target: { value: 'Premium' } })
    fireEvent.change(countryInput, { target: { value: 'USA' } })

    const form = document.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)

    await waitFor(() => {
      // Component shows "Enter a valid email address" for invalid emails
      expect(screen.getByText(/Enter a valid email address/i)).toBeInTheDocument()
    })
  })

  it('creates a new customer with valid data', async () => {
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)
    vi.mocked(customerService.default.createCustomer).mockResolvedValue({
      id: 3,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      segment: 'Premium',
      country: 'Canada',
    })

    render(<Customers />)

    await waitFor(() => {
      expect(screen.queryByLabelText(/Loading customers/i)).not.toBeInTheDocument()
    })

    const inputs = document.querySelectorAll('input')
    const nameInput = inputs[0]
    const emailInput = inputs[1]
    const segmentInput = inputs[2]
    const countryInput = inputs[3]

    fireEvent.change(nameInput, { target: { value: 'Charlie Brown' } })
    fireEvent.change(emailInput, { target: { value: 'charlie@example.com' } })
    fireEvent.change(segmentInput, { target: { value: 'Premium' } })
    fireEvent.change(countryInput, { target: { value: 'Canada' } })

    const submitButton = screen.getByText('Create Customer')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(customerService.default.createCustomer).toHaveBeenCalledWith({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        segment: 'Premium',
        country: 'Canada',
      })
    })
  })

  it('populates form when editing a customer', async () => {
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Customers />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    const inputs = document.querySelectorAll('input')
    const nameInput = inputs[0] as HTMLInputElement
    expect(nameInput.value).toBe('Alice Smith')

    const emailInput = inputs[1] as HTMLInputElement
    expect(emailInput.value).toBe('alice@example.com')
  })

  it('deletes a customer when delete is confirmed', async () => {
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)
    vi.mocked(customerService.default.deleteCustomer).mockResolvedValue(undefined)

    render(<Customers />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    // Click the Delete button to open the ConfirmDialog
    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    // ConfirmDialog appears - click the confirm "Delete" button inside the dialog
    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    // The dialog has a confirm button with text "Delete"
    const confirmButton = screen.getByRole('alertdialog').querySelector('.confirm-btn--danger') as HTMLElement
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(customerService.default.deleteCustomer).toHaveBeenCalledWith(1)
    })
  })

  it('displays error message on load failure', async () => {
    vi.mocked(customerService.default.getCustomers).mockRejectedValue(
      new Error('Failed to load customers')
    )

    render(<Customers />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load customers/i)).toBeInTheDocument()
    })
  })

  it('displays table headers', async () => {
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Customers />)

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Segment')).toBeInTheDocument()
      expect(screen.getByText('Country')).toBeInTheDocument()
    })
  })
})
