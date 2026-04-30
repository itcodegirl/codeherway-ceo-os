import ChiefTelemetryDiagnostics from './ChiefTelemetryDiagnostics';
import { useChiefTelemetryHealth } from '../../hooks/useChiefTelemetryHealth';
import '../../styles/chief-telemetry.css';

export default function ChiefTelemetryDiagnosticsPanel() {
  const {
    source,
    recentCount,
    lastEventTimestamp,
    lastRequestId,
    lastCorrelationId,
    recentEvents,
    outcomeCounters,
    isLoading,
    error,
  } = useChiefTelemetryHealth();

  return (
    <ChiefTelemetryDiagnostics
      source={source}
      recentCount={recentCount}
      lastEventTimestamp={lastEventTimestamp}
      lastRequestId={lastRequestId}
      lastCorrelationId={lastCorrelationId}
      recentEvents={recentEvents}
      outcomeCounters={outcomeCounters}
      isLoading={isLoading}
      error={error}
    />
  );
}
