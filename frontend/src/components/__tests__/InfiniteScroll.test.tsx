import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InfiniteScroll } from '../InfiniteScroll'

vi.mock('../InfiniteScroll.css', () => ({}))

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: mockObserve,
  unobserve: mockUnobserve,
  disconnect: mockDisconnect,
}))

const makeQuery = (overrides = {}) => ({
  data: undefined,
  fetchNextPage: vi.fn(),
  hasNextPage: false,
  isFetchingNextPage: false,
  isLoading: false,
  isError: false,
  error: null,
  ...overrides,
})

describe('InfiniteScroll', () => {
  it('shows loading state when isLoading=true', () => {
    render(
      <InfiniteScroll
        query={makeQuery({ isLoading: true }) as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
      />
    )
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows custom loading component', () => {
    render(
      <InfiniteScroll
        query={makeQuery({ isLoading: true }) as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
        loadingComponent={<div>Custom Loading</div>}
      />
    )
    expect(screen.getByText('Custom Loading')).toBeInTheDocument()
  })

  it('shows error state when isError=true', () => {
    render(
      <InfiniteScroll
        query={makeQuery({ isError: true, error: new Error('Load failed') }) as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
      />
    )
    expect(screen.getByText('Error loading data')).toBeInTheDocument()
    expect(screen.getByText('Load failed')).toBeInTheDocument()
  })

  it('shows custom error component', () => {
    render(
      <InfiniteScroll
        query={makeQuery({ isError: true, error: new Error('Oops') }) as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
        errorComponent={(err) => <div>Custom: {err.message}</div>}
      />
    )
    expect(screen.getByText('Custom: Oops')).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(
      <InfiniteScroll
        query={makeQuery({ data: { pages: [] } }) as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
      />
    )
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('shows custom empty component', () => {
    render(
      <InfiniteScroll
        query={makeQuery({ data: { pages: [] } }) as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
        emptyComponent={<div>Nothing here</div>}
      />
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  it('renders items from pages', () => {
    const query = makeQuery({
      data: {
        pages: [
          { data: ['Item A', 'Item B'], hasMore: false },
        ],
      },
      hasNextPage: false,
    })

    render(
      <InfiniteScroll
        query={query as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string, i: number) => i}
      />
    )

    expect(screen.getByText('Item A')).toBeInTheDocument()
    expect(screen.getByText('Item B')).toBeInTheDocument()
  })

  it('shows end-of-list message when no more pages', () => {
    const query = makeQuery({
      data: {
        pages: [{ data: ['Item A'], hasMore: false }],
      },
      hasNextPage: false,
    })

    render(
      <InfiniteScroll
        query={query as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
      />
    )

    expect(screen.getByText('No more items to load')).toBeInTheDocument()
  })

  it('shows loading more indicator when fetching next page', () => {
    const query = makeQuery({
      data: {
        pages: [{ data: ['Item A'], hasMore: true }],
      },
      hasNextPage: true,
      isFetchingNextPage: true,
    })

    render(
      <InfiniteScroll
        query={query as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
      />
    )

    expect(screen.getByText('Loading more...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const query = makeQuery({
      data: { pages: [{ data: ['Item'], hasMore: false }] },
    })

    const { container } = render(
      <InfiniteScroll
        query={query as any}
        renderItem={(item: string) => <div>{item}</div>}
        getItemKey={(item: string) => item}
        className="my-custom-class"
      />
    )

    expect(container.querySelector('.my-custom-class')).toBeInTheDocument()
  })
})
