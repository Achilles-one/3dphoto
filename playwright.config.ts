import { defineConfig } from '@playwright/test';

const externalBaseUrl = process.env.MP4_TEST_BASE_URL;
const deploymentBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  outputDir: 'output/playwright/results',
  reporter: [['line']],
  use: {
    baseURL: externalBaseUrl || 'http://127.0.0.1:4173',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
    acceptDownloads: true,
    extraHTTPHeaders: deploymentBypass
      ? { 'x-vercel-protection-bypass': deploymentBypass }
      : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: undefined,
});
