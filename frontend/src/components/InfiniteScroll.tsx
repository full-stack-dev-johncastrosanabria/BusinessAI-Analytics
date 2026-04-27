import { useEffect, useRef } from 'react'
import { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query'
import './InfiniteScroll.css'

interface InfiniteScrollProps<T> {
  query: UseInfiniteQueryResult<InfiniteData<{ data: T[]; hasMore: boolean }>, Error>
  renderItem: (item: T, index: number) => React.ReactNode
  loadingComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  errorComponent?: (error: Error) => React.ReactNode
  threshold?: number
  className?: string
}

export function InfiniteScroll<T>({
  query,
  renderItem,
  loadingComponent,
  emptyComponent,
  errorComponent,
  threshold = 100,
  className = '',
}: InfiniteScrollProps<T>) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = query

  const observerTarget = useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0, rootMargin: `${threshold}px` }
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, threshold])

  // Flatten all pages into single array
  const allItems = data?.pages.flatMap((page: { data: T[] }) => page.data) ?? []

  // Loading state
  if (isLoading) {
    return (
      <div className="infinite-scroll-loading">
        {loadingComponent || <DefaultLoader />}
      </div>
    )
  }

  // Error state
  if (isError && error) {
    return (
      <div className="infinite-scroll-error">
        {errorComponent ? (
          errorComponent(error)
        ) : (
          <DefaultError error={error} />
        )}
      </div>
    )
  }

  // Empty state
  if (allItems.length === 0) {
    return (
      <div className="infinite-scroll-empty">
        {emptyComponent || <DefaultEmpty />}
      </div>
    )
  }

  return (
    <div className={`infinite-scroll-container ${className}`}>
      <div className="infinite-scroll-list">
        {allItems.map((item: T, index: number) => (
          <div key={index} className="infinite-scroll-item">
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Observer target for triggering next page load */}
      <div ref={observerTarget} className="infinite-scroll-trigger" />

      {/* Loading indicator for next page */}
      {isFetchingNextPage && (
        <div className="infinite-scroll-loading-more">
          {loadingComponent || <DefaultLoader text="Loading more..." />}
        </div>
      )}

      {/* End of list indicator */}
      {!hasNextPage && allItems.length > 0 && (
        <div className="infinite-scroll-end">
          <p>No more items to load</p>
        </div>
      )}
    </div>
  )
}

// Default components
function DefaultLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="default-loader">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  )
}

function DefaultError({ error }: { error: Error }) {
  return (
    <div className="default-error">
      <p>Error loading data</p>
      <p className="error-message">{error.message}</p>
    </div>
  )
}

function DefaultEmpty() {
  return (
    <div className="default-empty">
      <p>No items found</p>
    </div>
  )
}
