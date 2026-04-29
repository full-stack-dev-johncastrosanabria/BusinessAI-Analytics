import { useState, useEffect, useMemo, useCallback } from 'react'
import salesService, { SalesTransaction } from '../services/salesService'
import './SalesTable.css'

// Pagination configuration
const DEFAULT_PAGE_SIZE = 20

export default function SalesTable() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = DEFAULT_PAGE_SIZE

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await salesService.getSalesTransactions()
      setTransactions(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Client-side pagination — memoized to avoid recomputing on unrelated re-renders
  const { paginatedTransactions, totalPages } = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return {
      paginatedTransactions: transactions.slice(startIndex, endIndex),
      totalPages: Math.ceil(transactions.length / pageSize),
    }
  }, [transactions, page, pageSize])

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading sales data</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="sales-table-page">
      <div className="page-header">
        <h1>Sales Transactions</h1>
        <p className="page-description">
          Browse all sales transactions ({transactions.length} total)
        </p>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="sales-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Customer ID</th>
              <th>Product ID</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="loading-cell">
                  <div className="spinner" />
                  Loading...
                </td>
              </tr>
            ) : paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No transactions found
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </td>
                  <td>{transaction.customerId}</td>
                  <td>{transaction.productId}</td>
                  <td className="text-right">{transaction.quantity}</td>
                  <td className="text-right">
                    ${transaction.totalAmount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Simple Pagination */}
      {!loading && transactions.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages} ({transactions.length} total)
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
