import { useState, useEffect } from 'react'
import customerService, { Customer, CreateCustomerRequest } from '../services/customerService'
import './CRUD.css'

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    segment: '',
    country: '',
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await customerService.getCustomers()
      setCustomers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateEmail(formData.email)) {
      setError('Invalid email format')
      return
    }
    try {
      if (editingId) {
        await customerService.updateCustomer(editingId, formData)
      } else {
        await customerService.createCustomer(formData)
      }
      setFormData({ name: '', email: '', segment: '', country: '' })
      setEditingId(null)
      await fetchCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer')
    }
  }

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      segment: customer.segment,
      country: customer.country,
    })
    setEditingId(customer.id)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this customer?')) return
    try {
      await customerService.deleteCustomer(id)
      await fetchCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer')
    }
  }

  return (
    <div className="crud-page">
      <h1>Customers</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Segment</label>
          <input
            type="text"
            value={formData.segment}
            onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Country</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="btn-submit">
          {editingId ? 'Update' : 'Create'} Customer
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setFormData({ name: '', email: '', segment: '', country: '' })
            }}
            className="btn-cancel"
          >
            Cancel
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading">Loading customers...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Segment</th>
                <th>Country</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.segment}</td>
                  <td>{customer.country}</td>
                  <td>
                    <button onClick={() => handleEdit(customer)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(customer.id)} className="btn-delete">
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

export default Customers
