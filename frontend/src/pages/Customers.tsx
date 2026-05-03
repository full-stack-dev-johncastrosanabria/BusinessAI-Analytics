import { useState, useEffect, SubmitEvent } from 'react'
import customerService, { Customer, CreateCustomerRequest } from '../services/customerService'
import { SkeletonTable } from '../components/Skeleton'
import { Tooltip, ConfirmDialog } from '../components/ui'
import './CRUD.css'

interface FormErrors {
  name?: string
  email?: string
  segment?: string
  country?: string
}

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    email: '',
    segment: '',
    country: '',
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await customerService.getCustomers()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string) => {
    const atIndex = email.indexOf('@')
    if (atIndex <= 0) return false
    const local = email.slice(0, atIndex)
    const rest = email.slice(atIndex + 1)
    const dotIndex = rest.lastIndexOf('.')
    if (dotIndex <= 0 || dotIndex === rest.length - 1) return false
    return !local.includes('@') && !rest.includes('@')
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!formData.segment.trim()) errors.segment = 'Segment is required'
    if (!formData.country.trim()) errors.country = 'Country is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      if (editingId) {
        await customerService.updateCustomer(editingId, formData)
        showSuccess('Customer updated successfully')
      } else {
        await customerService.createCustomer(formData)
        showSuccess('Customer created successfully')
      }
      setFormData({ name: '', email: '', segment: '', country: '' })
      setFormErrors({})
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
    setFormErrors({})
    setEditingId(customer.id)
    globalThis.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await customerService.deleteCustomer(deleteTarget.id)
      showSuccess(`Customer "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      await fetchCustomers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="crud-page">
      <h1>Customers</h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button className="dismiss-btn" onClick={() => setError(null)} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="success-message" role="status">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form" noValidate>
        <div className="form-group">
          <label htmlFor="customer-name">Name</label>
          <input
            id="customer-name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
            }}
            aria-invalid={!!formErrors.name}
            aria-describedby={formErrors.name ? 'customer-name-error' : undefined}
            placeholder="Full name"
          />
          {formErrors.name && (
            <span id="customer-name-error" className="field-error" role="alert">
              {formErrors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="customer-email">
            Email
            <Tooltip content="Used for notifications and account login" position="right">
              <span className="help-icon" aria-label="Email help">?</span>
            </Tooltip>
          </label>
          <input
            id="customer-email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value })
              if (formErrors.email) setFormErrors({ ...formErrors, email: undefined })
            }}
            aria-invalid={!!formErrors.email}
            aria-describedby={formErrors.email ? 'customer-email-error' : undefined}
            placeholder="name@example.com"
          />
          {formErrors.email && (
            <span id="customer-email-error" className="field-error" role="alert">
              {formErrors.email}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="customer-segment">
            Segment
            <Tooltip content="Customer classification: e.g. Enterprise, SMB, Consumer" position="right">
              <span className="help-icon" aria-label="Segment help">?</span>
            </Tooltip>
          </label>
          <input
            id="customer-segment"
            type="text"
            value={formData.segment}
            onChange={(e) => {
              setFormData({ ...formData, segment: e.target.value })
              if (formErrors.segment) setFormErrors({ ...formErrors, segment: undefined })
            }}
            aria-invalid={!!formErrors.segment}
            aria-describedby={formErrors.segment ? 'customer-segment-error' : undefined}
            placeholder="e.g. Enterprise"
          />
          {formErrors.segment && (
            <span id="customer-segment-error" className="field-error" role="alert">
              {formErrors.segment}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="customer-country">Country</label>
          <input
            id="customer-country"
            type="text"
            value={formData.country}
            onChange={(e) => {
              setFormData({ ...formData, country: e.target.value })
              if (formErrors.country) setFormErrors({ ...formErrors, country: undefined })
            }}
            aria-invalid={!!formErrors.country}
            aria-describedby={formErrors.country ? 'customer-country-error' : undefined}
            placeholder="e.g. United States"
          />
          {formErrors.country && (
            <span id="customer-country-error" className="field-error" role="alert">
              {formErrors.country}
            </span>
          )}
        </div>

        <Tooltip content={editingId ? 'Save changes to this customer' : 'Add a new customer'}>
          <button type="submit" className="btn-submit">
            {editingId ? 'Update' : 'Create'} Customer
          </button>
        </Tooltip>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setFormErrors({})
              setFormData({ name: '', email: '', segment: '', country: '' })
            }}
            className="btn-cancel"
          >
            Cancel
          </button>
        )}
      </form>

      {loading ? (
        <div aria-busy="true" aria-label="Loading customers">
          <SkeletonTable rows={5} cols={5} />
        </div>
      ) : (
        <div className="table-container">
          {customers.length === 0 ? (
            <p className="empty-state">No customers yet. Create one above.</p>
          ) : (
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
                      <Tooltip content="Edit this customer">
                        <button onClick={() => handleEdit(customer)} className="btn-edit">
                          Edit
                        </button>
                      </Tooltip>
                      <Tooltip content="Permanently delete this customer" position="left">
                        <button
                          onClick={() => setDeleteTarget(customer)}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default Customers
