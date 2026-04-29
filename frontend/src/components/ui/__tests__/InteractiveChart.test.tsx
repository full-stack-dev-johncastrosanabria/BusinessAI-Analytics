import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InteractiveChart } from '../InteractiveChart'

const sampleData = [
  { month: '2024-01', sales: 10000, costs: 6000, profit: 4000 },
  { month: '2024-02', sales: 12000, costs: 7000, profit: 5000 },
  { month: '2024-03', sales: 9000, costs: 5500, profit: 3500 },
]

const lineSeries = [
  { dataKey: 'sales', color: '#8884d8', name: 'Sales' },
  { dataKey: 'costs', color: '#82ca9d', name: 'Costs' },
]

describe('InteractiveChart', () => {
  it('renders the chart title', () => {
    render(
      <InteractiveChart
        data={sampleData}
        series={lineSeries}
        xDataKey="month"
        title="Sales Trend"
      />
    )
    expect(screen.getByText('Sales Trend')).toBeInTheDocument()
  })

  it('renders export buttons when handlers are provided', () => {
    const onCSV = vi.fn()
    const onJSON = vi.fn()
    render(
      <InteractiveChart
        data={sampleData}
        series={lineSeries}
        xDataKey="month"
        onExportCSV={onCSV}
        onExportJSON={onJSON}
      />
    )
    expect(screen.getByLabelText('Export as CSV')).toBeInTheDocument()
    expect(screen.getByLabelText('Export as JSON')).toBeInTheDocument()
  })

  it('calls onExportCSV when CSV button is clicked', () => {
    const onCSV = vi.fn()
    render(
      <InteractiveChart
        data={sampleData}
        series={lineSeries}
        xDataKey="month"
        onExportCSV={onCSV}
      />
    )
    fireEvent.click(screen.getByLabelText('Export as CSV'))
    expect(onCSV).toHaveBeenCalledTimes(1)
  })

  it('calls onExportJSON when JSON button is clicked', () => {
    const onJSON = vi.fn()
    render(
      <InteractiveChart
        data={sampleData}
        series={lineSeries}
        xDataKey="month"
        onExportJSON={onJSON}
      />
    )
    fireEvent.click(screen.getByLabelText('Export as JSON'))
    expect(onJSON).toHaveBeenCalledTimes(1)
  })

  it('does not render export buttons when handlers are absent', () => {
    render(
      <InteractiveChart
        data={sampleData}
        series={lineSeries}
        xDataKey="month"
      />
    )
    expect(screen.queryByLabelText('Export as CSV')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Export as JSON')).not.toBeInTheDocument()
  })

  it('renders without title when title prop is omitted', () => {
    render(
      <InteractiveChart
        data={sampleData}
        series={lineSeries}
        xDataKey="month"
      />
    )
    // No h2 title element should be present
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders bar chart type without errors', () => {
    render(
      <InteractiveChart
        data={sampleData}
        series={[{ dataKey: 'sales', color: '#8884d8', name: 'Sales' }]}
        xDataKey="month"
        chartType="bar"
        title="Bar Chart"
      />
    )
    expect(screen.getByText('Bar Chart')).toBeInTheDocument()
  })

  it('shows zoom hint text when data has more than one point', () => {
    render(
      <InteractiveChart
        data={sampleData}
        series={lineSeries}
        xDataKey="month"
      />
    )
    expect(screen.getByText(/drag on the chart to zoom/i)).toBeInTheDocument()
  })

  it('does not show zoom hint for single data point', () => {
    render(
      <InteractiveChart
        data={[sampleData[0]]}
        series={lineSeries}
        xDataKey="month"
      />
    )
    expect(screen.queryByText(/drag on the chart to zoom/i)).not.toBeInTheDocument()
  })
})
