import { defineConfig } from '@playwright/test';

const PORT = 4173;
const isCi = Boolean(globalThis.process?.env?.CI);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: isCi ? 1 : 0,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
