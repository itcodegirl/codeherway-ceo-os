import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const distAssetsDir = path.resolve(process.cwd(), 'dist', 'assets');
const defaultBaselinePath = path.resolve(process.cwd(), 'scripts', 'route-performance-baseline.json');

const routeBudgets = [
  {
    route: 'Dashboard',
    js: { rawKb: 20, gzipKb: 6.5 },
    // Raw bumped 5 → 5.5 (audit Phase 4b reminder inline-edit styles).
    // Bumped 5.5 → 6.1 to absorb the main-focus panel disclosure toggle
    // button styles (audit Phase 4 collapsible panel). Gzip bumped to 1.65
    // to reflect the additional selector blocks.
    css: { rawKb: 6.1, gzipKb: 1.65 },
  },
  {
    route: 'Opportunities',
    js: { rawKb: 14, gzipKb: 4.5 },
    css: { rawKb: 4, gzipKb: 1.5 },
  },
  {
    route: 'ContentOS',
    js: { rawKb: 12, gzipKb: 4 },
    css: { rawKb: 4, gzipKb: 1.5 },
  },
  {
    route: 'WeeklyBrief',
    js: { rawKb: 16, gzipKb: 5 },
    // Raw bumped 3.0 → 3.5 to absorb the light-mode autosave-status-dot
    // ring overrides; gzip ceiling unchanged.
    css: { rawKb: 3.5, gzipKb: 1.2 },
  },
  {
    route: 'ChiefOfStaff',
    js: { rawKb: 42, gzipKb: 12.5 },
    css: { rawKb: 4, gzipKb: 1.5 },
  },
  {
    route: 'Settings',
    js: { rawKb: 6, gzipKb: 2.5 },
    css: null,
  },
];

function toKb(bytes) {
  return bytes / 1024;
}

function formatKb(kb) {
  return `${kb.toFixed(2)} kB`;
}

function parseArgs(argv) {
  const args = Array.isArray(argv) ? argv : [];
  const options = {
    baselinePath: '',
    maxRegressionPct: 8,
    requireBaseline: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--baseline') {
      options.baselinePath = args[index + 1] || '';
      index += 1;
      continue;
    }

    if (value === '--max-regression-pct') {
      const parsed = Number(args[index + 1]);
      if (Number.isFinite(parsed) && parsed >= 0) {
        options.maxRegressionPct = parsed;
      }
      index += 1;
      continue;
    }

    if (value === '--require-baseline') {
      options.requireBaseline = true;
    }
  }

  return options;
}

async function readAssetStats(assetPath) {
  const content = await readFile(assetPath);
  const rawKb = toKb(content.byteLength);
  const gzipKb = toKb(gzipSync(content).byteLength);
  return { rawKb, gzipKb };
}

async function readBaselineFile(baselinePath) {
  if (!baselinePath || !existsSync(baselinePath)) {
    return null;
  }

  try {
    const raw = await readFile(baselinePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function getAllowedRegressionMetric(baselineValue, maxRegressionPct) {
  return baselineValue * (1 + (maxRegressionPct / 100));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baselinePath = options.baselinePath
    ? path.resolve(process.cwd(), options.baselinePath)
    : options.requireBaseline
      ? defaultBaselinePath
      : '';

  const assetNames = await readdir(distAssetsDir);
  const failures = [];
  const reports = [];
  const measured = {};

  for (const budget of routeBudgets) {
    const jsAssetName = assetNames.find((name) => name.startsWith(`${budget.route}-`) && name.endsWith('.js'));
    const cssAssetName = assetNames.find((name) => name.startsWith(`${budget.route}-`) && name.endsWith('.css'));
    measured[budget.route] = {};

    if (!jsAssetName) {
      failures.push(`${budget.route}: missing route JS bundle in dist/assets`);
      continue;
    }

    const jsStats = await readAssetStats(path.join(distAssetsDir, jsAssetName));
    measured[budget.route].js = jsStats;
    reports.push(`${budget.route} JS ${jsAssetName} (${formatKb(jsStats.rawKb)} raw, ${formatKb(jsStats.gzipKb)} gzip)`);

    if (jsStats.rawKb > budget.js.rawKb || jsStats.gzipKb > budget.js.gzipKb) {
      failures.push(
        `${budget.route} JS budget exceeded: raw ${formatKb(jsStats.rawKb)} <= ${formatKb(budget.js.rawKb)}, gzip ${formatKb(jsStats.gzipKb)} <= ${formatKb(budget.js.gzipKb)}`,
      );
    }

    if (!budget.css) {
      continue;
    }

    if (!cssAssetName) {
      failures.push(`${budget.route}: missing route CSS bundle in dist/assets`);
      continue;
    }

    const cssStats = await readAssetStats(path.join(distAssetsDir, cssAssetName));
    measured[budget.route].css = cssStats;
    reports.push(`${budget.route} CSS ${cssAssetName} (${formatKb(cssStats.rawKb)} raw, ${formatKb(cssStats.gzipKb)} gzip)`);

    if (cssStats.rawKb > budget.css.rawKb || cssStats.gzipKb > budget.css.gzipKb) {
      failures.push(
        `${budget.route} CSS budget exceeded: raw ${formatKb(cssStats.rawKb)} <= ${formatKb(budget.css.rawKb)}, gzip ${formatKb(cssStats.gzipKb)} <= ${formatKb(budget.css.gzipKb)}`,
      );
    }
  }

  console.log('Route performance budget report:');
  reports.forEach((line) => console.log(`- ${line}`));

  const baseline = baselinePath ? await readBaselineFile(baselinePath) : null;
  if (options.requireBaseline && !baseline) {
    failures.push(`Route performance baseline is required but missing or invalid at ${baselinePath}`);
  }

  if (baseline && baseline.routes && typeof baseline.routes === 'object') {
    const trendFailures = [];
    Object.entries(baseline.routes).forEach(([route, metrics]) => {
      const routeMetrics = measured[route];
      if (!routeMetrics || !metrics || typeof metrics !== 'object') {
        return;
      }

      ['js', 'css'].forEach((assetType) => {
        const currentAsset = routeMetrics[assetType];
        const baselineAsset = metrics[assetType];
        if (!currentAsset || !baselineAsset || typeof baselineAsset !== 'object') {
          return;
        }

        ['rawKb', 'gzipKb'].forEach((metricKey) => {
          const baselineValue = Number(baselineAsset[metricKey]);
          const currentValue = Number(currentAsset[metricKey]);
          if (!Number.isFinite(baselineValue) || !Number.isFinite(currentValue) || baselineValue <= 0) {
            return;
          }

          const allowedMax = getAllowedRegressionMetric(baselineValue, options.maxRegressionPct);
          if (currentValue > allowedMax) {
            trendFailures.push(
              `${route} ${assetType.toUpperCase()} ${metricKey} regressed: ${formatKb(currentValue)} > ${formatKb(allowedMax)} (baseline ${formatKb(baselineValue)}, +${options.maxRegressionPct}% limit)`,
            );
          }
        });
      });
    });

    if (trendFailures.length) {
      failures.push(...trendFailures);
    } else {
      console.log(
        `\nRoute performance trend report: no regressions over ${options.maxRegressionPct}% vs baseline ${path.relative(process.cwd(), baselinePath)}.`,
      );
    }
  } else if (options.baselinePath || options.requireBaseline) {
    failures.push(`Unable to load route performance baseline from ${baselinePath}`);
  } else {
    console.log('\nRoute performance trend report: baseline not provided (static budgets only).');
  }

  if (failures.length) {
    console.error('\nRoute performance budget failures:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('\nAll route performance checks are within limits.');
}

main().catch((error) => {
  console.error('Unable to evaluate route performance budgets.', error);
  process.exit(1);
});
