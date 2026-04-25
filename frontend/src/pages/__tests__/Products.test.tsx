import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Products from '../Products'
import * as productService from '../../services/productService'

vi.mock('../../services/productService')

const mockProducts = [
  { id: 1, name: 'Laptop', category: 'Electronics', cost: 800, price: 1200 },
  { id: 2, name: 'Mouse', category: 'Accessories', cost: 10, price: 25 },
]

describe('Products Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders products table', async () => {
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)

    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument()
      expect(screen.getByText('Mouse')).toBeInTheDocument()
    })
  })

  it('displays form for creating products', () => {
    vi.mocked(productService.default.getProducts).mockResolvedValue([])

    render(<Products />)

    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toBeInTheDocument()
    expect(screen.getByLabelText('Cost')).toBeInTheDocument()
    expect(screen.getByLabelText('Price')).toBeInTheDocument()
  })

  it('creates a new product', async () => {
    vi.mocked(productService.default.getProducts).mockResolvedValue(mockProducts)
    vi.mocked(productService.default.createProduct).mockResolvedValue({
      id: 3,
      name: 'Keyboard',
      category: 'Accessories',
      cost: 50,
      price: 100,
    })

    render(<Products />)

    const nameInput = screen.getByLabelText('Name')
    fireEvent.change(nameInput, { target: { value: 'Keyboard' } })

    const categoryInput = screen.getByLabelText('Category')
    fireEvent.change(categoryInput, { target: { value: 'Accessories' } })

    const costInput = screen.getByLabelText('Cost')
    fireEvent.change(costInput, { target: { value: '50' } })

    const priceInput = screen.getByLabelText('Price')
    fireEvent.change(priceInput, { target: { value: '100' } })

    const submitButton = screen.getByText('Create Product')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(productService.default.createProduct).toHaveBeenCalled()
    })
  })

  it('displays error message on load failure', async () => {
    vi.mocked(productService.default.getProducts).mockRejectedValue(
      new Error('Failed to load')
    )

    render(<Products />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load products/)).toBeInTheDocument()
    })
  })
})
