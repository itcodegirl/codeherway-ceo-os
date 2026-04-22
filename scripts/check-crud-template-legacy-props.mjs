import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const DEADLINE_ISO = '2026-09-30T23:59:59.999Z';
const DEADLINE_DATE = new Date(DEADLINE_ISO);
const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const LEGACY_PROP_PATTERN = /\b(summary|section|modals)\s*=/;

function walkFiles(dir) {
  const output = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      output.push(...walkFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name);
    if (EXTENSIONS.has(extension)) {
      output.push(fullPath);
    }
  }

  return output;
}

function isEligibleForScan(filePath) {
  if (filePath.includes(`${path.sep}__snapshots__${path.sep}`)) {
    return false;
  }

  if (filePath.includes('.test.')) {
    return false;
  }

  if (filePath.endsWith(`${path.sep}CrudPageTemplate.jsx`)) {
    return false;
  }

  return true;
}

function findLegacyUsage(filePath) {
  const content = readFileSync(filePath, 'utf8');
  if (!content.includes('CrudPageTemplate')) {
    return false;
  }

  return LEGACY_PROP_PATTERN.test(content);
}

function formatRelative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function run() {
  if (!statSync(SRC_DIR).isDirectory()) {
    console.log('[crud-template-guard] Source directory not found, skipping.');
    return 0;
  }

  const allFiles = walkFiles(SRC_DIR);
  const scannedFiles = allFiles.filter(isEligibleForScan);
  const findings = scannedFiles.filter(findLegacyUsage).map(formatRelative);
  const now = new Date();
  const deadlinePassed = now > DEADLINE_DATE;

  if (findings.length === 0) {
    console.log('[crud-template-guard] OK: no legacy CrudPageTemplate props found in production source files.');
    return 0;
  }

  const details = findings.map((file) => `- ${file}`).join('\n');

  if (!deadlinePassed) {
    console.warn(
      `[crud-template-guard] WARNING: legacy CrudPageTemplate props detected before deadline ${DEADLINE_ISO}.\n${details}\nMigrate to slots.summary / slots.section / slots.modals before the deadline.`,
    );
    return 0;
  }

  console.error(
    `[crud-template-guard] ERROR: legacy CrudPageTemplate props are still present after deadline ${DEADLINE_ISO}.\n${details}\nThis guard now fails CI until all usages are migrated to slots.*.`,
  );
  return 1;
}

process.exitCode = run();
