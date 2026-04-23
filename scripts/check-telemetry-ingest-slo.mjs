import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.resolve(repoRoot, 'artifacts');
const reportPath = path.resolve(artifactsDir, 'telemetry-ingest-slo-report.md');

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeNumber(value, fallback) {
  const parsed = Number.parseFloat(value || '');
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function calculateP95(values) {
  if (!Array.isArray(values) || !values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function writeReport(markdown) {
  await fs.mkdir(artifactsDir, { recursive: true });
  await fs.writeFile(reportPath, markdown, 'utf8');
}

function buildProbePayload(index) {
  const now = new Date().toISOString();
  return {
    source: 'ceo-os-slo-monitor',
    eventType: 'app_error',
    sentAt: now,
    idempotencyKey: `slo-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}`,
    events: [
      {
        event: 'ui_error_boundary',
        timestamp: now,
        name: 'SLOMonitorProbe',
        message: `slo-probe-${index}`,
        route: '/ops/slo-monitor',
      },
    ],
  };
}

function signHmacSha256(bodyText, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(bodyText);
  return `hmac-sha256=${hmac.digest('hex')}`;
}

function signEd25519(bodyText, privateKeyPem) {
  const signatureBuffer = crypto.sign(null, Buffer.from(bodyText), privateKeyPem);
  return `ed25519=${signatureBuffer.toString('base64')}`;
}

function buildSignatureHeader(bodyText) {
  const signatureMode = normalizeText(
    process.env.TELEMETRY_INGEST_MONITOR_SIGNATURE_MODE,
  ).toLowerCase();
  if (!signatureMode) {
    return '';
  }

  if (signatureMode === 'hmac-sha256') {
    const hmacSecret = normalizeText(process.env.TELEMETRY_INGEST_MONITOR_HMAC_SECRET);
    if (!hmacSecret) {
      throw new Error('TELEMETRY_INGEST_MONITOR_HMAC_SECRET is required for hmac-sha256 mode');
    }
    return signHmacSha256(bodyText, hmacSecret);
  }

  if (signatureMode === 'ed25519') {
    const privateKeyPem = normalizeText(process.env.TELEMETRY_INGEST_MONITOR_ED25519_PRIVATE_KEY_PEM);
    if (!privateKeyPem) {
      throw new Error('TELEMETRY_INGEST_MONITOR_ED25519_PRIVATE_KEY_PEM is required for ed25519 mode');
    }
    return signEd25519(bodyText, privateKeyPem);
  }

  throw new Error(`Unsupported TELEMETRY_INGEST_MONITOR_SIGNATURE_MODE: ${signatureMode}`);
}

async function runProbe({
  url,
  token,
  signatureKeyId,
  attempt,
}) {
  const payload = buildProbePayload(attempt);
  const bodyText = JSON.stringify(payload);
  const signatureHeader = buildSignatureHeader(bodyText);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'x-app-telemetry-token': token } : {}),
    ...(signatureHeader ? { 'x-app-telemetry-signature': signatureHeader } : {}),
    ...(signatureHeader && signatureKeyId ? { 'x-app-telemetry-signature-key-id': signatureKeyId } : {}),
  };

  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyText,
    });
    const elapsedMs = performance.now() - startedAt;
    return {
      ok: response.ok,
      status: response.status,
      elapsedMs,
      error: '',
    };
  } catch (error) {
    const elapsedMs = performance.now() - startedAt;
    return {
      ok: false,
      status: 0,
      elapsedMs,
      error: error?.message || 'request failed',
    };
  }
}

async function main() {
  const monitorUrl = normalizeText(process.env.TELEMETRY_INGEST_MONITOR_URL);
  const monitorToken = normalizeText(process.env.TELEMETRY_INGEST_MONITOR_TOKEN);
  const signatureKeyId = normalizeText(process.env.TELEMETRY_INGEST_MONITOR_SIGNATURE_KEY_ID);
  const probeCount = parsePositiveInt(process.env.TELEMETRY_INGEST_MONITOR_PROBE_COUNT, 10);
  const maxP95Ms = parseNonNegativeNumber(process.env.TELEMETRY_INGEST_MONITOR_MAX_P95_MS, 1200);
  const maxErrorRatePct = parseNonNegativeNumber(
    process.env.TELEMETRY_INGEST_MONITOR_MAX_ERROR_RATE_PCT,
    5,
  );

  if (!monitorUrl) {
    const skippedReport = [
      '# Telemetry Ingest Endpoint SLO Report',
      '',
      'Status: skipped (missing `TELEMETRY_INGEST_MONITOR_URL`).',
    ].join('\n');
    await writeReport(skippedReport);
    console.log(skippedReport);
    return;
  }

  const results = [];
  for (let attempt = 1; attempt <= probeCount; attempt += 1) {
    // Sequential probes keep endpoint pressure predictable.
    // This monitor validates reliability signals, not load-test throughput.
    const probeResult = await runProbe({
      url: monitorUrl,
      token: monitorToken,
      signatureKeyId,
      attempt,
    });
    results.push(probeResult);
  }

  const latencies = results.map((result) => result.elapsedMs);
  const p95Latency = calculateP95(latencies);
  const failureCount = results.filter((result) => !result.ok).length;
  const errorRatePct = probeCount ? (failureCount / probeCount) * 100 : 0;
  const passed = p95Latency <= maxP95Ms && errorRatePct <= maxErrorRatePct;

  const reportLines = [
    '# Telemetry Ingest Endpoint SLO Report',
    '',
    `- Probe count: ${probeCount}`,
    `- Failed probes: ${failureCount}`,
    `- Non-2xx rate: ${errorRatePct.toFixed(2)}%`,
    `- P95 latency: ${p95Latency.toFixed(2)}ms`,
    `- Max allowed non-2xx rate: ${maxErrorRatePct.toFixed(2)}%`,
    `- Max allowed p95 latency: ${maxP95Ms.toFixed(2)}ms`,
    `- Result: ${passed ? 'pass' : 'fail'}`,
    '',
    '## Probe outcomes',
    '',
    ...results.map((result, index) => (
      `- Probe ${index + 1}: status=${result.status || 'error'}, latency=${result.elapsedMs.toFixed(2)}ms${result.error ? `, error=${result.error}` : ''}`
    )),
  ];
  const reportMarkdown = reportLines.join('\n');
  await writeReport(reportMarkdown);
  console.log(reportMarkdown);

  if (!passed) {
    process.exit(1);
  }
}

main().catch(async (error) => {
  const report = [
    '# Telemetry Ingest Endpoint SLO Report',
    '',
    '- Result: fail',
    `- Error: ${error?.message || String(error)}`,
  ].join('\n');
  await writeReport(report);
  console.error('Unable to run telemetry ingest SLO monitor.', error);
  process.exit(1);
});
