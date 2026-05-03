import { describe, it, expect } from 'vitest'

// Importing from the index file covers the re-export lines
describe('sonarqube/index exports', () => {
  it('exports SonarQubeClient', async () => {
    const mod = await import('../index')
    expect(typeof mod.SonarQubeClient).toBe('function')
  })

  it('exports SonarQubeError', async () => {
    const mod = await import('../index')
    expect(typeof mod.SonarQubeError).toBe('function')
  })

  it('exports createSonarQubeClient', async () => {
    const mod = await import('../index')
    expect(typeof mod.createSonarQubeClient).toBe('function')
  })

  it('exports analyzeHistoricalTrends', async () => {
    const mod = await import('../index')
    expect(typeof mod.analyzeHistoricalTrends).toBe('function')
  })

  it('exports buildNumericTrend', async () => {
    const mod = await import('../index')
    expect(typeof mod.buildNumericTrend).toBe('function')
  })

  it('exports buildRatingTrend', async () => {
    const mod = await import('../index')
    expect(typeof mod.buildRatingTrend).toBe('function')
  })

  it('exports calculateTrendDirection', async () => {
    const mod = await import('../index')
    expect(typeof mod.calculateTrendDirection).toBe('function')
  })

  it('exports calculateChangePercent', async () => {
    const mod = await import('../index')
    expect(typeof mod.calculateChangePercent).toBe('function')
  })

  it('exports ratingToNumeric', async () => {
    const mod = await import('../index')
    expect(typeof mod.ratingToNumeric).toBe('function')
  })

  it('exports parseTechnicalDebtMinutes', async () => {
    const mod = await import('../index')
    expect(typeof mod.parseTechnicalDebtMinutes).toBe('function')
  })

  it('exports totalIssueCount', async () => {
    const mod = await import('../index')
    expect(typeof mod.totalIssueCount).toBe('function')
  })

  it('exports getRecommendationForIssue', async () => {
    const mod = await import('../index')
    expect(typeof mod.getRecommendationForIssue).toBe('function')
  })

  it('exports generateRecommendations', async () => {
    const mod = await import('../index')
    expect(typeof mod.generateRecommendations).toBe('function')
  })

  it('exports categorizeIssues', async () => {
    const mod = await import('../index')
    expect(typeof mod.categorizeIssues).toBe('function')
  })

  it('exports IssueResolutionQueue', async () => {
    const mod = await import('../index')
    expect(typeof mod.IssueResolutionQueue).toBe('function')
  })

  it('exports createResolutionQueue', async () => {
    const mod = await import('../index')
    expect(typeof mod.createResolutionQueue).toBe('function')
  })
})
