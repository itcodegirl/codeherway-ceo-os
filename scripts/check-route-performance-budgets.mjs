import { gzipSync } from 'node:zlib';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const distAssetsDir = path.resolve(process.cwd(), 'dist', 'assets');

const routeBudgets = [
  {
    route: 'Dashboard',
    js: { rawKb: 20, gzipKb: 6 },
    css: { rawKb: 4, gzipKb: 1.5 },
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
    css: { rawKb: 3, gzipKb: 1.2 },
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

async function readAssetStats(assetPath) {
  const content = await readFile(assetPath);
  const rawKb = toKb(content.byteLength);
  const gzipKb = toKb(gzipSync(content).byteLength);
  return { rawKb, gzipKb };
}

async function main() {
  const assetNames = await readdir(distAssetsDir);
  const failures = [];
  const reports = [];

  for (const budget of routeBudgets) {
    const jsAssetName = assetNames.find((name) => name.startsWith(`${budget.route}-`) && name.endsWith('.js'));
    const cssAssetName = assetNames.find((name) => name.startsWith(`${budget.route}-`) && name.endsWith('.css'));

    if (!jsAssetName) {
      failures.push(`${budget.route}: missing route JS bundle in dist/assets`);
      continue;
    }

    const jsStats = await readAssetStats(path.join(distAssetsDir, jsAssetName));
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
    reports.push(`${budget.route} CSS ${cssAssetName} (${formatKb(cssStats.rawKb)} raw, ${formatKb(cssStats.gzipKb)} gzip)`);

    if (cssStats.rawKb > budget.css.rawKb || cssStats.gzipKb > budget.css.gzipKb) {
      failures.push(
        `${budget.route} CSS budget exceeded: raw ${formatKb(cssStats.rawKb)} <= ${formatKb(budget.css.rawKb)}, gzip ${formatKb(cssStats.gzipKb)} <= ${formatKb(budget.css.gzipKb)}`,
      );
    }
  }

  console.log('Route performance budget report:');
  reports.forEach((line) => console.log(`- ${line}`));

  if (failures.length) {
    console.error('\nRoute performance budget failures:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log('\nAll route performance budgets are within limits.');
}

main().catch((error) => {
  console.error('Unable to evaluate route performance budgets.', error);
  process.exit(1);
});
