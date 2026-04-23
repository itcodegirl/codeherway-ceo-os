import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function resolveSupabaseRuntime() {
  const url = normalizeText(
    process.env.SLO_TREND_SUPABASE_URL
    || process.env.SUPABASE_TEST_URL
    || process.env.SUPABASE_URL,
  );
  const serviceRoleKey = normalizeText(
    process.env.SLO_TREND_SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return {
    url,
    serviceRoleKey,
    configured: Boolean(url && serviceRoleKey && typeof fetch === 'function'),
  };
}

function resolveSnapshotPath() {
  const configuredPath = normalizeText(process.env.SLO_TREND_SNAPSHOT_PATH);
  if (configuredPath) {
    return path.resolve(repoRoot, configuredPath);
  }

  return path.resolve(repoRoot, 'artifacts', 'slo-trend-snapshot.json');
}

async function readSnapshot(snapshotPath) {
  const fileContent = await fs.readFile(snapshotPath, 'utf8');
  const parsed = JSON.parse(fileContent);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('SLO trend snapshot must be a JSON object.');
  }

  return parsed;
}

function buildSnapshotRow(snapshot) {
  const workflow = snapshot?.workflow && typeof snapshot.workflow === 'object'
    ? snapshot.workflow
    : {};
  const outcomes = snapshot?.outcomes && typeof snapshot.outcomes === 'object'
    ? snapshot.outcomes
    : {};
  const metrics = snapshot?.metrics && typeof snapshot.metrics === 'object'
    ? snapshot.metrics
    : {};
  const reports = snapshot?.reports && typeof snapshot.reports === 'object'
    ? snapshot.reports
    : {};

  const runId = normalizeText(workflow.run_id);
  if (!runId) {
    throw new Error('SLO trend snapshot is missing workflow.run_id.');
  }

  const capturedAt = normalizeText(snapshot.captured_at || workflow.captured_at || new Date().toISOString());
  const capturedAtMs = Date.parse(capturedAt);
  if (!Number.isFinite(capturedAtMs)) {
    throw new Error('SLO trend snapshot captured_at must be an ISO datetime string.');
  }

  return {
    run_id: runId,
    run_number: normalizeText(workflow.run_number),
    run_url: normalizeText(workflow.run_url),
    repository: normalizeText(workflow.repository),
    git_ref: normalizeText(workflow.ref),
    captured_at: new Date(capturedAtMs).toISOString(),
    route_trend_outcome: normalizeText(outcomes.route_trend),
    telemetry_health_outcome: normalizeText(outcomes.telemetry_health),
    telemetry_endpoint_slo_outcome: normalizeText(outcomes.telemetry_endpoint_slo),
    telemetry_health_failure_rate_pct: normalizeNumber(metrics.telemetry_health_failure_rate_pct),
    telemetry_health_max_failure_rate_pct: normalizeNumber(metrics.telemetry_health_max_failure_rate_pct),
    telemetry_endpoint_slo_p95_ms: normalizeNumber(metrics.telemetry_endpoint_slo_p95_ms),
    telemetry_endpoint_slo_non_2xx_rate_pct: normalizeNumber(metrics.telemetry_endpoint_slo_non_2xx_rate_pct),
    telemetry_endpoint_slo_max_p95_ms: normalizeNumber(metrics.telemetry_endpoint_slo_max_p95_ms),
    telemetry_endpoint_slo_max_non_2xx_rate_pct: normalizeNumber(metrics.telemetry_endpoint_slo_max_non_2xx_rate_pct),
    reports_excerpt: {
      route_size_report_excerpt: normalizeText(reports.route_size_report_excerpt),
      telemetry_health_report_excerpt: normalizeText(reports.telemetry_health_report_excerpt),
      telemetry_endpoint_slo_report_excerpt: normalizeText(reports.telemetry_endpoint_slo_report_excerpt),
    },
    metadata: {
      persisted_by: 'scripts/persist-slo-trend-snapshot.mjs',
      persisted_at: new Date().toISOString(),
    },
  };
}

async function persistSnapshot({ url, serviceRoleKey, row }) {
  const response = await fetch(`${url}/rest/v1/ops_slo_snapshots?on_conflict=run_id`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Failed to persist SLO snapshot (${response.status})${details ? `: ${details}` : ''}`);
  }
}

async function main() {
  const snapshotPath = resolveSnapshotPath();
  const supabaseRuntime = resolveSupabaseRuntime();

  if (!supabaseRuntime.configured) {
    console.log('Skipped SLO snapshot persistence (Supabase runtime is not configured).');
    return;
  }

  const snapshot = await readSnapshot(snapshotPath);
  const row = buildSnapshotRow(snapshot);
  await persistSnapshot({
    url: supabaseRuntime.url,
    serviceRoleKey: supabaseRuntime.serviceRoleKey,
    row,
  });

  console.log(`Persisted SLO snapshot for run_id=${row.run_id}.`);
}

main().catch((error) => {
  console.error('Unable to persist SLO trend snapshot.', error);
  process.exit(1);
});
