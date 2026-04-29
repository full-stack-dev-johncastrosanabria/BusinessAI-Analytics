import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Sales from '../Sales'
import * as salesService from '../../services/salesService'
import * as productService from '../../services/productService'
import * as customerService from '../../services/customerService'
import { 
  setupTestEnvironment, 
  createMockProducts, 
  createMockCustomers, 
  createMockTransactions,
  expectTableHeaders
} from '../../test/utils'

vi.mock('../../services/salesService')
vi.mock('../../services/productService')
vi.mock('../../services/customerService')

describe('Sales Component', () => {
  setupTestEnvironment();
  
  const mockProducts = createMockProducts();
  const mockCustomers = createMockCustomers();
  const mockTransactions = createMockTransactions();

  it('displays loading state initially', () => {
    vi.mocked(salesService.default.getSalesTransactions).mockReturnValue(new Promise(() => {}))
    vi.mocked(productService.default.getProducts).mockReturnValue(new Promise(() => {}))
    vi.mocked(customerService.default.getCustomers).mockReturnValue(new Promise(() => {}))

    render(<Sales />)

    expect(screen.getByText(/Loading transactions/i)).toBeInTheDocument()
  })

  it('renders transaction table after loading', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue(mockTransactions)
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText('$2400.00')).toBeInTheDocument()
      expect(screen.getByText('$125.00')).toBeInTheDocument()
    })
  })

  it('renders customer and product dropdowns', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue([])
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText('Select Customer')).toBeInTheDocument()
      expect(screen.getByText('Select Product')).toBeInTheDocument()
    })
  })

  it('populates customer dropdown with customers', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue([])
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    })
  })

  it('populates product dropdown with products', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue([])
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText('Laptop ($1200.00)')).toBeInTheDocument()
      expect(screen.getByText('Mouse ($25.00)')).toBeInTheDocument()
    })
  })

  it('creates a transaction on form submit', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue(mockTransactions)
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)
    vi.mocked(salesService.default.createSalesTransaction).mockResolvedValue({
      id: 3,
      customerId: 1,
      productId: 1,
      transactionDate: '2024-01-20',
      quantity: 1,
      totalAmount: 1200,
    })

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText('Select Customer')).toBeInTheDocument()
    })

    const selects = document.querySelectorAll('select')
    const customerSelect = selects[0]
    const productSelect = selects[1]

    fireEvent.change(customerSelect, { target: { value: '1' } })
    fireEvent.change(productSelect, { target: { value: '1' } })

    const quantityInput = document.querySelector('input[type="number"]') as HTMLInputElement
    fireEvent.change(quantityInput, { target: { value: '1' } })

    const submitButton = screen.getByText('Create Transaction')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(salesService.default.createSalesTransaction).toHaveBeenCalled()
    })
  })

  it('displays date range filter inputs', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue([])
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText('From Date:')).toBeInTheDocument()
      expect(screen.getByText('To Date:')).toBeInTheDocument()
    })
  })

  it('calls getSalesTransactions with filters when filter button is clicked', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue(mockTransactions)
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText('Filter')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Filter'))

    await waitFor(() => {
      expect(salesService.default.getSalesTransactions).toHaveBeenCalledTimes(2)
    })
  })

  it('displays error message on load failure', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockRejectedValue(
      new Error('Failed to load data')
    )
    vi.mocked(productService.default.getProducts).mockResolvedValue([])
    vi.mocked(customerService.default.getCustomers).mockResolvedValue([])

    render(<Sales />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load data/i)).toBeInTheDocument()
    })
  })

  it('displays table headers', async () => {
    vi.mocked(salesService.default.getSalesTransactions).mockResolvedValue(mockTransactions)
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(customerService.default.getCustomers).mockResolvedValue(mockCustomers)

    render(<Sales />)

    await waitFor(() => {
      expectTableHeaders(['Date', 'Customer', 'Product', 'Quantity', 'Total Amount']);
    })
  })
})
