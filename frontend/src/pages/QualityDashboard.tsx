/**
 * Quality Dashboard
 *
 * Displays real-time quality metrics (maintainability, reliability, security
 * ratings), coverage, technical debt, issue counts, quality gate status, and
 * actionable recommendations.
 *
 * Requirements: 1.4, 1.7
 */

import { useState } from 'react';
import type { QualityMetrics, Rating } from '../lib/sonarqube/types';
import type { HistoricalTrendData, TrendDirection } from '../lib/sonarqube/qualityTrends';
import type { Recommendation } from '../lib/sonarqube/recommendations';
import './QualityDashboard.css';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RatingBadgeProps {
  rating: Rating;
  label: string;
}

function RatingBadge({ rating, label }: RatingBadgeProps) {
  return (
    <div className="qd-rating-card" aria-label={`${label}: ${rating}`}>
      <span className={`qd-rating-badge qd-rating-${rating}`} aria-hidden="true">
        {rating}
      </span>
      <span className="qd-rating-label">{label}</span>
    </div>
  );
}

interface TrendIndicatorProps {
  direction: TrendDirection;
}

function TrendIndicator({ direction }: TrendIndicatorProps) {
  const icons: Record<TrendDirection, string> = {
    improving: '↑',
    degrading: '↓',
    stable: '→',
  };
  return (
    <span
      className={`qd-trend qd-trend-${direction}`}
      aria-label={`Trend: ${direction}`}
      title={direction}
    >
      {icons[direction]}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: TrendDirection;
  unit?: string;
}

function MetricCard({ label, value, trend, unit }: MetricCardProps) {
  return (
    <div className="qd-metric-card">
      <span className="qd-metric-label">{label}</span>
      <span className="qd-metric-value">
        {value}
        {unit && <span className="qd-metric-unit">{unit}</span>}
        {trend && <TrendIndicator direction={trend} />}
      </span>
    </div>
  );
}

interface QualityGateBadgeProps {
  status: 'PASSED' | 'FAILED' | 'NONE';
}

function QualityGateBadge({ status }: QualityGateBadgeProps) {
  const labels = { PASSED: 'Quality Gate: Passed', FAILED: 'Quality Gate: Failed', NONE: 'Quality Gate: N/A' };
  return (
    <div className={`qd-gate-badge qd-gate-${status.toLowerCase()}`} role="status" aria-label={labels[status]}>
      {labels[status]}
    </div>
  );
}

interface RecommendationListProps {
  recommendations: Recommendation[];
}

function RecommendationList({ recommendations }: RecommendationListProps) {
  if (recommendations.length === 0) {
    return <p className="qd-no-recommendations">No recommendations — great work!</p>;
  }

  return (
    <ul className="qd-recommendation-list" aria-label="Actionable recommendations">
      {recommendations.map((rec, i) => (
        <li key={i} className={`qd-recommendation qd-effort-${rec.effort}`}>
          <div className="qd-rec-header">
            <strong className="qd-rec-title">{rec.title}</strong>
            <span className={`qd-rec-effort qd-effort-${rec.effort}`}>{rec.effort} effort</span>
          </div>
          <p className="qd-rec-description">{rec.description}</p>
          {rec.documentationUrl && (
            <a
              href={rec.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qd-rec-link"
              aria-label={`Documentation for: ${rec.title}`}
            >
              View documentation ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface QualityDashboardProps {
  /** Current quality metrics snapshot. */
  metrics: QualityMetrics;
  /** Optional historical trend data for trend indicators. */
  trends?: HistoricalTrendData;
  /** Actionable recommendations derived from current issues. */
  recommendations?: Recommendation[];
  /** Whether metrics are being refreshed. */
  isLoading?: boolean;
  /** Error message if metrics could not be loaded. */
  error?: string | null;
}

export function QualityDashboard({
  metrics,
  trends,
  recommendations = [],
  isLoading = false,
  error = null,
}: QualityDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'recommendations'>(
    'overview',
  );

  if (isLoading) {
    return (
      <div className="qd-root qd-loading" role="status" aria-live="polite">
        <div className="qd-skeleton qd-skeleton-header" aria-hidden="true" />
        <div className="qd-skeleton qd-skeleton-ratings" aria-hidden="true" />
        <div className="qd-skeleton qd-skeleton-metrics" aria-hidden="true" />
        <span className="sr-only">Loading quality metrics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qd-root qd-error" role="alert">
        <p>Failed to load quality metrics: {error}</p>
      </div>
    );
  }

  const totalIssues =
    metrics.issues.blocker +
    metrics.issues.critical +
    metrics.issues.major +
    metrics.issues.minor +
    metrics.issues.info;

  return (
    <div className="qd-root">
      {/* Header */}
      <div className="qd-header">
        <h2 className="qd-title">Code Quality Dashboard</h2>
        <div className="qd-header-right">
          <QualityGateBadge status={metrics.qualityGateStatus} />
          <span className="qd-project-key" aria-label="Project key">
            {metrics.projectKey}
          </span>
          <span className="qd-timestamp" aria-label="Last updated">
            Updated: {metrics.timestamp.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Ratings row */}
      <section className="qd-ratings-section" aria-label="Quality ratings">
        <RatingBadge rating={metrics.maintainabilityRating} label="Maintainability" />
        <RatingBadge rating={metrics.reliabilityRating} label="Reliability" />
        <RatingBadge rating={metrics.securityRating} label="Security" />
      </section>

      {/* Tabs */}
      <div className="qd-tabs" role="tablist" aria-label="Dashboard sections">
        {(['overview', 'issues', 'recommendations'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`qd-tab ${activeTab === tab ? 'qd-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'recommendations' && recommendations.length > 0 && (
              <span className="qd-tab-badge" aria-label={`${recommendations.length} recommendations`}>
                {recommendations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="qd-tab-content">
        {activeTab === 'overview' && (
          <section aria-label="Overview metrics" className="qd-overview">
            <div className="qd-metrics-grid">
              <MetricCard
                label="Coverage"
                value={metrics.coverage.toFixed(1)}
                unit="%"
                trend={trends?.coverage.direction}
              />
              <MetricCard
                label="Duplications"
                value={metrics.duplicatedLinesDensity.toFixed(1)}
                unit="%"
              />
              <MetricCard
                label="Lines of Code"
                value={metrics.linesOfCode.toLocaleString()}
              />
              <MetricCard
                label="Technical Debt"
                value={metrics.technicalDebt}
                trend={trends?.technicalDebt.direction}
              />
              <MetricCard
                label="Total Issues"
                value={totalIssues}
                trend={trends?.totalIssues.direction}
              />
            </div>
          </section>
        )}

        {activeTab === 'issues' && (
          <section aria-label="Issue breakdown" className="qd-issues">
            <table className="qd-issues-table" aria-label="Issues by severity">
              <thead>
                <tr>
                  <th scope="col">Severity</th>
                  <th scope="col">Count</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['Blocker', metrics.issues.blocker, 'blocker'],
                    ['Critical', metrics.issues.critical, 'critical'],
                    ['Major', metrics.issues.major, 'major'],
                    ['Minor', metrics.issues.minor, 'minor'],
                    ['Info', metrics.issues.info, 'info'],
                  ] as [string, number, string][]
                ).map(([label, count, cls]) => (
                  <tr key={cls}>
                    <td>
                      <span className={`qd-severity-badge qd-severity-${cls}`}>{label}</span>
                    </td>
                    <td className="qd-issue-count">{count}</td>
                  </tr>
                ))}
                <tr className="qd-issues-total">
                  <td>
                    <strong>Total</strong>
                  </td>
                  <td className="qd-issue-count">
                    <strong>{totalIssues}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'recommendations' && (
          <section aria-label="Recommendations" className="qd-recommendations">
            <RecommendationList recommendations={recommendations} />
          </section>
        )}
      </div>
    </div>
  );
}

export default QualityDashboard;
