import { useState, useEffect, useRef } from 'react'
import salesService, { SalesTransaction } from '../services/salesService'
import './SalesInfinite.css'

// Pagination configuration
const PAGE_SIZE = 20

function SalesInfinite() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([])
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
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
  }

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < transactions.length) {
          setDisplayCount(prev => Math.min(prev + PAGE_SIZE, transactions.length))
        }
      },
      { threshold: 0, rootMargin: '100px' }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [displayCount, transactions.length])

  const displayedTransactions = transactions.slice(0, displayCount)
  const hasMore = displayCount < transactions.length

  if (loading) {
    return (
      <div className="sales-infinite">
        <h1>Sales Transactions (Infinite Scroll)</h1>
        <div className="loading">Loading transactions...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sales-infinite">
        <h1>Sales Transactions (Infinite Scroll)</h1>
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="sales-infinite">
      <h1>Sales Transactions (Infinite Scroll)</h1>
      <div className="stats">
        Showing {displayedTransactions.length} of {transactions.length} transactions
      </div>

      <div className="transactions-list">
        {displayedTransactions.map((transaction) => (
          <div key={transaction.id} className="transaction-card">
            <div className="transaction-header">
              <span className="transaction-id">#{transaction.id}</span>
              <span className="transaction-date">
                {new Date(transaction.transactionDate).toLocaleDateString()}
              </span>
            </div>
            <div className="transaction-details">
              <div className="detail-row">
                <span className="label">Customer ID:</span>
                <span className="value">{transaction.customerId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Product ID:</span>
                <span className="value">{transaction.productId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Quantity:</span>
                <span className="value">{transaction.quantity}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total:</span>
                <span className="value revenue">
                  ${transaction.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Observer target for triggering next page load */}
      <div ref={observerTarget} className="infinite-scroll-trigger" />

      {/* Loading indicator */}
      {hasMore && (
        <div className="loading-more">
          Loading more...
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && transactions.length > 0 && (
        <div className="end-of-list">
          <p>No more transactions to load</p>
        </div>
      )}
    </div>
  )
}

export default SalesInfinite
