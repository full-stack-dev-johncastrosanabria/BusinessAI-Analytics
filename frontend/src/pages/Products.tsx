import { useState, useEffect } from 'react'
import productService, { Product, CreateProductRequest } from '../services/productService'
import { SkeletonTable } from '../components/Skeleton'
import { Tooltip, ConfirmDialog } from '../components/ui'
import './CRUD.css'

interface FormErrors {
  name?: string
  category?: string
  cost?: string
  price?: string
}

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    category: '',
    cost: 0,
    price: 0,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await productService.getProducts()
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.category.trim()) errors.category = 'Category is required'
    if (formData.cost < 0) errors.cost = 'Cost must be 0 or greater'
    if (formData.price < 0) errors.price = 'Price must be 0 or greater'
    if (formData.price < formData.cost) errors.price = 'Price should not be less than cost'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    try {
      if (editingId) {
        await productService.updateProduct(editingId, formData)
        showSuccess('Product updated successfully')
      } else {
        await productService.createProduct(formData)
        showSuccess('Product created successfully')
      }
      setFormData({ name: '', category: '', cost: 0, price: 0 })
      setFormErrors({})
      setEditingId(null)
      await fetchProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      cost: product.cost,
      price: product.price,
    })
    setFormErrors({})
    setEditingId(product.id)
    globalThis.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await productService.deleteProduct(deleteTarget.id)
      showSuccess(`Product "${deleteTarget.name}" deleted`)
      setDeleteTarget(null)
      await fetchProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="crud-page">
      <h1>Products</h1>

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
          <label htmlFor="product-name">Name</label>
          <input
            id="product-name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value })
              if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
            }}
            aria-invalid={!!formErrors.name}
            aria-describedby={formErrors.name ? 'product-name-error' : undefined}
            placeholder="Product name"
          />
          {formErrors.name && (
            <span id="product-name-error" className="field-error" role="alert">
              {formErrors.name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="product-category">Category</label>
          <input
            id="product-category"
            type="text"
            value={formData.category}
            onChange={(e) => {
              setFormData({ ...formData, category: e.target.value })
              if (formErrors.category) setFormErrors({ ...formErrors, category: undefined })
            }}
            aria-invalid={!!formErrors.category}
            aria-describedby={formErrors.category ? 'product-category-error' : undefined}
            placeholder="e.g. Electronics"
          />
          {formErrors.category && (
            <span id="product-category-error" className="field-error" role="alert">
              {formErrors.category}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="product-cost">
            Cost
            <Tooltip content="Your purchase or production cost for this product" position="right">
              <span className="help-icon" aria-label="Cost help">?</span>
            </Tooltip>
          </label>
          <input
            id="product-cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost}
            onChange={(e) => {
              setFormData({ ...formData, cost: Number.parseFloat(e.target.value) || 0 })
              if (formErrors.cost) setFormErrors({ ...formErrors, cost: undefined })
            }}
            aria-invalid={!!formErrors.cost}
            aria-describedby={formErrors.cost ? 'product-cost-error' : undefined}
          />
          {formErrors.cost && (
            <span id="product-cost-error" className="field-error" role="alert">
              {formErrors.cost}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="product-price">
            Price
            <Tooltip content="Selling price shown to customers. Should be ≥ cost." position="right">
              <span className="help-icon" aria-label="Price help">?</span>
            </Tooltip>
          </label>
          <input
            id="product-price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => {
              setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })
              if (formErrors.price) setFormErrors({ ...formErrors, price: undefined })
            }}
            aria-invalid={!!formErrors.price}
            aria-describedby={formErrors.price ? 'product-price-error' : undefined}
          />
          {formErrors.price && (
            <span id="product-price-error" className="field-error" role="alert">
              {formErrors.price}
            </span>
          )}
        </div>

        <Tooltip content={editingId ? 'Save changes to this product' : 'Add a new product'}>
          <button type="submit" className="btn-submit">
            {editingId ? 'Update' : 'Create'} Product
          </button>
        </Tooltip>

        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setFormErrors({})
              setFormData({ name: '', category: '', cost: 0, price: 0 })
            }}
            className="btn-cancel"
          >
            Cancel
          </button>
        )}
      </form>

      {loading ? (
        <div aria-busy="true" aria-label="Loading products">
          <SkeletonTable rows={5} cols={5} />
        </div>
      ) : (
        <div className="table-container">
          {products.length === 0 ? (
            <p className="empty-state">No products yet. Create one above.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>${product.cost.toFixed(2)}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>
                      <Tooltip content="Edit this product">
                        <button onClick={() => handleEdit(product)} className="btn-edit">
                          Edit
                        </button>
                      </Tooltip>
                      <Tooltip content="Permanently delete this product" position="left">
                        <button
                          onClick={() => setDeleteTarget(product)}
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
        title="Delete Product"
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

export default Products
