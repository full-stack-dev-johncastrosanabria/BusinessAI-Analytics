import { useState, useEffect } from 'react'
import salesService, { SalesTransaction, CreateSalesTransactionRequest } from '../services/salesService'
import productService, { Product } from '../services/productService'
import customerService, { Customer } from '../services/customerService'
import './CRUD.css'

function Sales() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateSalesTransactionRequest>({
    customerId: 0,
    productId: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    quantity: 1,
  })
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [txns, prods, custs] = await Promise.all([
        salesService.getSalesTransactions(),
        productService.getProducts(),
        customerService.getCustomers(),
      ])
      setTransactions(Array.isArray(txns) ? txns : [])
      setProducts(Array.isArray(prods) ? prods : [])
      setCustomers(Array.isArray(custs) ? custs : [])
    } catch (err) {
      console.error('Error fetching sales data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setTransactions([]) // Set empty arrays on error
      setProducts([])
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await salesService.createSalesTransaction(formData)
      setFormData({
        customerId: 0,
        productId: 0,
        transactionDate: new Date().toISOString().split('T')[0],
        quantity: 1,
      })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction')
    }
  }

  const handleFilter = async () => {
    try {
      const filtered = await salesService.getSalesTransactions({
        dateFrom: filterDateFrom || undefined,
        dateTo: filterDateTo || undefined,
      })
      setTransactions(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter transactions')
    }
  }

  return (
    <div className="crud-page">
      <h1>Sales Transactions</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Customer</label>
          <select
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: parseInt(e.target.value) })}
            required
          >
            <option value={0}>Select Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Product</label>
          <select
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
            required
          >
            <option value={0}>Select Product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (${p.price.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={formData.transactionDate}
            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            required
          />
        </div>
        <button type="submit" className="btn-submit">
          Create Transaction
        </button>
      </form>

      <div className="filter-section">
        <div className="form-group">
          <label>From Date:</label>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>To Date:</label>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>
        <button onClick={handleFilter} className="btn-submit">
          Filter
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading transactions...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn) => (
                <tr key={txn.id}>
                  <td>{new Date(txn.transactionDate).toLocaleDateString()}</td>
                  <td>{customers.find((c) => c.id === txn.customerId)?.name}</td>
                  <td>{products.find((p) => p.id === txn.productId)?.name}</td>
                  <td>{txn.quantity}</td>
                  <td>${txn.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Sales
