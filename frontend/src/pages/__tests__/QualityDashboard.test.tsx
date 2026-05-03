import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QualityDashboard from '../QualityDashboard'
import type { QualityMetrics } from '../../lib/sonarqube/types'
import type { HistoricalTrendData } from '../../lib/sonarqube/qualityTrends'
import type { Recommendation } from '../../lib/sonarqube/recommendations'

vi.mock('../QualityDashboard.css', () => ({}))

const mockMetrics: QualityMetrics = {
  projectKey: 'my-project',
  timestamp: new Date('2024-01-15T10:00:00Z'),
  overallRating: 'A',
  maintainabilityRating: 'A',
  reliabilityRating: 'B',
  securityRating: 'A',
  coverage: 82.5,
  duplicatedLinesDensity: 2.1,
  linesOfCode: 5000,
  technicalDebt: 'PT2H',
  issues: {
    blocker: 0,
    critical: 1,
    major: 5,
    minor: 10,
    info: 3,
  },
  qualityGateStatus: 'PASSED',
}

const mockTrends: HistoricalTrendData = {
  coverage: { direction: 'improving', points: [] },
  technicalDebt: { direction: 'stable', points: [] },
  totalIssues: { direction: 'degrading', points: [] },
  maintainabilityRating: { direction: 'stable', points: [] },
  reliabilityRating: { direction: 'improving', points: [] },
  securityRating: { direction: 'stable', points: [] },
}

const mockRecommendations: Recommendation[] = [
  {
    title: 'Increase test coverage',
    description: 'Add more unit tests to improve coverage above 80%.',
    effort: 'medium',
    documentationUrl: 'https://docs.example.com/coverage',
  },
  {
    title: 'Fix critical issues',
    description: 'Address critical security vulnerabilities.',
    effort: 'high',
  },
]

describe('QualityDashboard', () => {
  it('renders loading state', () => {
    render(<QualityDashboard metrics={mockMetrics} isLoading={true} />)
    expect(screen.getByText('Loading quality metrics…')).toBeInTheDocument()
  })

  it('renders error state', () => {
    render(<QualityDashboard metrics={mockMetrics} error="Failed to connect" />)
    expect(screen.getByText(/Failed to load quality metrics: Failed to connect/)).toBeInTheDocument()
  })

  it('renders the dashboard title', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('Code Quality Dashboard')).toBeInTheDocument()
  })

  it('renders quality gate badge as PASSED', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('Quality Gate: Passed')).toBeInTheDocument()
  })

  it('renders quality gate badge as FAILED', () => {
    render(<QualityDashboard metrics={{ ...mockMetrics, qualityGateStatus: 'FAILED' }} />)
    expect(screen.getByText('Quality Gate: Failed')).toBeInTheDocument()
  })

  it('renders quality gate badge as NONE', () => {
    render(<QualityDashboard metrics={{ ...mockMetrics, qualityGateStatus: 'NONE' }} />)
    expect(screen.getByText('Quality Gate: N/A')).toBeInTheDocument()
  })

  it('renders rating badges', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByLabelText('Maintainability: A')).toBeInTheDocument()
    expect(screen.getByLabelText('Reliability: B')).toBeInTheDocument()
    expect(screen.getByLabelText('Security: A')).toBeInTheDocument()
  })

  it('renders project key', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('my-project')).toBeInTheDocument()
  })

  it('renders overview tab by default', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByLabelText('Overview metrics')).toBeInTheDocument()
  })

  it('renders coverage metric in overview', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('Coverage')).toBeInTheDocument()
    expect(screen.getByText('82.5')).toBeInTheDocument()
  })

  it('renders duplications metric in overview', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('Duplications')).toBeInTheDocument()
    expect(screen.getByText('2.1')).toBeInTheDocument()
  })

  it('renders lines of code metric', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('Lines of Code')).toBeInTheDocument()
    expect(screen.getByText('5,000')).toBeInTheDocument()
  })

  it('renders technical debt metric', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('Technical Debt')).toBeInTheDocument()
    expect(screen.getByText('PT2H')).toBeInTheDocument()
  })

  it('renders total issues metric', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByText('Total Issues')).toBeInTheDocument()
    // 0+1+5+10+3 = 19
    expect(screen.getByText('19')).toBeInTheDocument()
  })

  it('renders trend indicators when trends provided', () => {
    render(<QualityDashboard metrics={mockMetrics} trends={mockTrends} />)
    expect(screen.getByLabelText('Trend: improving')).toBeInTheDocument()
    expect(screen.getByLabelText('Trend: stable')).toBeInTheDocument()
    expect(screen.getByLabelText('Trend: degrading')).toBeInTheDocument()
  })

  it('switches to issues tab', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Issues' }))
    expect(screen.getByLabelText('Issue breakdown')).toBeInTheDocument()
  })

  it('shows issue counts in issues tab', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Issues' }))

    expect(screen.getByText('Blocker')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('Major')).toBeInTheDocument()
    expect(screen.getByText('Minor')).toBeInTheDocument()
    expect(screen.getByText('Info')).toBeInTheDocument()
  })

  it('shows total in issues tab', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Issues' }))
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('switches to recommendations tab', () => {
    render(<QualityDashboard metrics={mockMetrics} recommendations={mockRecommendations} />)
    fireEvent.click(screen.getByRole('tab', { name: /Recommendations/ }))
    expect(screen.getByLabelText('Recommendations')).toBeInTheDocument()
  })

  it('shows recommendations count badge', () => {
    render(<QualityDashboard metrics={mockMetrics} recommendations={mockRecommendations} />)
    expect(screen.getByLabelText('2 recommendations')).toBeInTheDocument()
  })

  it('renders recommendations list', () => {
    render(<QualityDashboard metrics={mockMetrics} recommendations={mockRecommendations} />)
    fireEvent.click(screen.getByRole('tab', { name: /Recommendations/ }))

    expect(screen.getByText('Increase test coverage')).toBeInTheDocument()
    expect(screen.getByText('Fix critical issues')).toBeInTheDocument()
  })

  it('renders documentation link when provided', () => {
    render(<QualityDashboard metrics={mockMetrics} recommendations={mockRecommendations} />)
    fireEvent.click(screen.getByRole('tab', { name: /Recommendations/ }))

    const link = screen.getByText('View documentation ↗')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://docs.example.com/coverage')
  })

  it('shows no-recommendations message when empty', () => {
    render(<QualityDashboard metrics={mockMetrics} recommendations={[]} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Recommendations' }))
    expect(screen.getByText('No recommendations — great work!')).toBeInTheDocument()
  })

  it('does not show recommendations badge when empty', () => {
    render(<QualityDashboard metrics={mockMetrics} recommendations={[]} />)
    expect(screen.queryByLabelText(/recommendations/)).not.toBeInTheDocument()
  })

  it('renders all three tabs', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Issues' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Recommendations' })).toBeInTheDocument()
  })

  it('marks active tab as selected', () => {
    render(<QualityDashboard metrics={mockMetrics} />)
    const overviewTab = screen.getByRole('tab', { name: 'Overview' })
    expect(overviewTab).toHaveAttribute('aria-selected', 'true')
  })

  it('renders trend up arrow for improving', () => {
    render(<QualityDashboard metrics={mockMetrics} trends={mockTrends} />)
    expect(screen.getByTitle('improving')).toBeInTheDocument()
  })

  it('renders trend down arrow for degrading', () => {
    render(<QualityDashboard metrics={mockMetrics} trends={mockTrends} />)
    expect(screen.getByTitle('degrading')).toBeInTheDocument()
  })

  it('renders trend right arrow for stable', () => {
    render(<QualityDashboard metrics={mockMetrics} trends={mockTrends} />)
    expect(screen.getAllByTitle('stable').length).toBeGreaterThan(0)
  })
})
