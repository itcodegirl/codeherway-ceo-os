import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.resolve(repoRoot, 'artifacts');
const outputPath = path.resolve(artifactsDir, 'slo-trend-snapshot.json');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseMetric(reportText, regex) {
  const match = reportText.match(regex);
  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

async function readReport(relativePath) {
  try {
    const fullPath = path.resolve(repoRoot, relativePath);
    return await fs.readFile(fullPath, 'utf8');
  } catch {
    return '';
  }
}

async function main() {
  const routeReport = await readReport('artifacts/route-size-report.md');
  const telemetryHealthReport = await readReport('artifacts/telemetry-ingest-health-report.md');
  const endpointSloReport = await readReport('artifacts/telemetry-ingest-slo-report.md');

  const snapshot = {
    captured_at: new Date().toISOString(),
    workflow: {
      run_id: normalizeText(process.env.GITHUB_RUN_ID),
      run_number: normalizeText(process.env.GITHUB_RUN_NUMBER),
      run_url: normalizeText(process.env.GITHUB_RUN_URL),
      repository: normalizeText(process.env.GITHUB_REPOSITORY),
      ref: normalizeText(process.env.GITHUB_REF_NAME),
    },
    outcomes: {
      route_trend: normalizeText(process.env.ROUTE_TREND_OUTCOME),
      telemetry_health: normalizeText(process.env.TELEMETRY_HEALTH_OUTCOME),
      telemetry_endpoint_slo: normalizeText(process.env.TELEMETRY_ENDPOINT_SLO_OUTCOME),
    },
    metrics: {
      telemetry_health_failure_rate_pct: parseMetric(
        telemetryHealthReport,
        /Failure rate:\s*([0-9]+(?:\.[0-9]+)?)%/i,
      ),
      telemetry_health_max_failure_rate_pct: parseMetric(
        telemetryHealthReport,
        /Max allowed failure rate:\s*([0-9]+(?:\.[0-9]+)?)%/i,
      ),
      telemetry_endpoint_slo_p95_ms: parseMetric(
        endpointSloReport,
        /P95 latency:\s*([0-9]+(?:\.[0-9]+)?)ms/i,
      ),
      telemetry_endpoint_slo_non_2xx_rate_pct: parseMetric(
        endpointSloReport,
        /Non-2xx rate:\s*([0-9]+(?:\.[0-9]+)?)%/i,
      ),
      telemetry_endpoint_slo_max_p95_ms: parseMetric(
        endpointSloReport,
        /Max allowed p95 latency:\s*([0-9]+(?:\.[0-9]+)?)ms/i,
      ),
      telemetry_endpoint_slo_max_non_2xx_rate_pct: parseMetric(
        endpointSloReport,
        /Max allowed non-2xx rate:\s*([0-9]+(?:\.[0-9]+)?)%/i,
      ),
    },
    reports: {
      route_size_report_excerpt: routeReport.slice(0, 5000),
      telemetry_health_report_excerpt: telemetryHealthReport.slice(0, 5000),
      telemetry_endpoint_slo_report_excerpt: endpointSloReport.slice(0, 5000),
    },
  };

  await fs.mkdir(artifactsDir, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`Wrote SLO trend snapshot: ${outputPath}`);
}

main().catch((error) => {
  console.error('Unable to build SLO trend snapshot.', error);
  process.exit(1);
});
