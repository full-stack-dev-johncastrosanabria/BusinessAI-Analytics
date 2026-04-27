import { useState, useEffect } from 'react'
import productService, { Product, CreateProductRequest } from '../services/productService'
import './CRUD.css'

function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    category: '',
    cost: 0,
    price: 0,
  })
  const [editingId, setEditingId] = useState<number | null>(null)

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
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
      setProducts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await productService.updateProduct(editingId, formData)
      } else {
        await productService.createProduct(formData)
      }
      setFormData({ name: '', category: '', cost: 0, price: 0 })
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
    setEditingId(product.id)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await productService.deleteProduct(id)
      await fetchProducts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product')
    }
  }

  return (
    <div className="crud-page">
      <h1>Products</h1>

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
          <label>Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label>Cost</label>
          <input
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
          />
        </div>
        <button type="submit" className="btn-submit">
          {editingId ? 'Update' : 'Create'} Product
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null)
              setFormData({ name: '', category: '', cost: 0, price: 0 })
            }}
            className="btn-cancel"
          >
            Cancel
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="table-container">
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
                    <button onClick={() => handleEdit(product)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="btn-delete">
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

export default Products
