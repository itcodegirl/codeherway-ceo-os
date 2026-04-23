import { useMemo } from 'react';
import PageHeader from '../components/ui/PageHeader';
import SectionCard from '../components/ui/SectionCard';
import SourceStatusNotice from '../components/ui/SourceStatusNotice';
import StatCard from '../components/ui/StatCard';
import { useOpsSloTrend } from '../hooks/useOpsSloTrend';
import { buildSourceNotice } from '../lib/uiCopy';
import '../styles/ops-reliability.css';

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '--';
  }

  return `${value.toFixed(2)}%`;
}

function formatMilliseconds(value) {
  if (!Number.isFinite(value)) {
    return '--';
  }

  return `${Math.round(value)}ms`;
}

function formatDateTime(value) {
  const parsed = Date.parse(value || '');
  if (!Number.isFinite(parsed)) {
    return '--';
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(parsed));
}

function formatOutcomeLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return 'Unknown';
  }

  if (normalized === 'success') {
    return 'Healthy';
  }

  if (normalized === 'failure') {
    return 'Degraded';
  }

  return normalized.replace(/_/g, ' ');
}

function buildStatusTone(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'failure') {
    return 'status-chip status-chip--danger';
  }

  if (normalized === 'success') {
    return 'status-chip status-chip--success';
  }

  return 'status-chip';
}

export default function OpsReliability() {
  const {
    snapshots,
    isLoading,
    loadError,
    source,
    refreshSnapshots,
  } = useOpsSloTrend({
    limit: 30,
  });

  const latestSnapshot = snapshots[0] || null;
  const statCards = useMemo(() => ([
    {
      id: 'snapshot-count',
      label: 'Snapshots Tracked',
      value: isLoading ? '--' : snapshots.length,
      change: latestSnapshot ? `Last capture ${formatDateTime(latestSnapshot.capturedAt)}` : 'No snapshots yet',
    },
    {
      id: 'route-trend',
      label: 'Route Trend Health',
      value: isLoading ? '--' : formatOutcomeLabel(latestSnapshot?.routeTrendOutcome),
      change: latestSnapshot
        ? `Ingest ${formatOutcomeLabel(latestSnapshot.telemetryHealthOutcome)}`
        : 'Awaiting first run',
    },
    {
      id: 'endpoint-latency',
      label: 'Endpoint p95',
      value: isLoading ? '--' : formatMilliseconds(latestSnapshot?.telemetryEndpointSloP95Ms),
      change: latestSnapshot
        ? `Budget ${formatMilliseconds(latestSnapshot.telemetryEndpointSloMaxP95Ms)}`
        : 'No latency sample yet',
    },
    {
      id: 'endpoint-errors',
      label: 'Endpoint Non-2xx',
      value: isLoading ? '--' : formatPercent(latestSnapshot?.telemetryEndpointSloNon2xxRatePct),
      change: latestSnapshot
        ? `Budget ${formatPercent(latestSnapshot.telemetryEndpointSloMaxNon2xxRatePct)}`
        : 'No error-rate sample yet',
    },
  ]), [isLoading, latestSnapshot, snapshots.length]);

  return (
    <section className="ops-reliability-page">
      <PageHeader
        title="Ops Reliability"
        description="Track route-size and telemetry ingest SLO trends from scheduled health runs."
      />

      <SourceStatusNotice
        source={source}
        supabaseText={buildSourceNotice('supabase', { supabasePrefix: 'SLO data source: ' })}
        localText={buildSourceNotice('local', { localPrefix: 'SLO data source: ' })}
        loadError={loadError}
        onRetry={refreshSnapshots}
        retryAriaLabel="Retry loading SLO trend snapshots"
      />

      <div className="dashboard-grid dashboard-grid--stats">
        {statCards.map((item) => (
          <StatCard
            key={item.id}
            label={item.label}
            value={item.value}
            change={item.change}
          />
        ))}
      </div>

      <SectionCard title="SLO Snapshot Trend" iconName="trend">
        {isLoading ? (
          <p className="helper-text">Loading reliability snapshots...</p>
        ) : snapshots.length ? (
          <div className="ops-table-wrapper">
            <table className="ops-table">
              <caption className="sr-only">Recent SLO snapshot trend entries</caption>
              <thead>
                <tr>
                  <th scope="col">Captured</th>
                  <th scope="col">Route Trend</th>
                  <th scope="col">Telemetry Health</th>
                  <th scope="col">Endpoint SLO</th>
                  <th scope="col">p95</th>
                  <th scope="col">Non-2xx</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((snapshot) => (
                  <tr key={snapshot.runId}>
                    <td>{formatDateTime(snapshot.capturedAt)}</td>
                    <td>
                      <span className={buildStatusTone(snapshot.routeTrendOutcome)}>
                        {formatOutcomeLabel(snapshot.routeTrendOutcome)}
                      </span>
                    </td>
                    <td>
                      <span className={buildStatusTone(snapshot.telemetryHealthOutcome)}>
                        {formatOutcomeLabel(snapshot.telemetryHealthOutcome)}
                      </span>
                    </td>
                    <td>
                      <span className={buildStatusTone(snapshot.telemetryEndpointSloOutcome)}>
                        {formatOutcomeLabel(snapshot.telemetryEndpointSloOutcome)}
                      </span>
                    </td>
                    <td>{formatMilliseconds(snapshot.telemetryEndpointSloP95Ms)}</td>
                    <td>{formatPercent(snapshot.telemetryEndpointSloNon2xxRatePct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="helper-text">No SLO snapshots are available yet.</p>
        )}
      </SectionCard>
    </section>
  );
}
