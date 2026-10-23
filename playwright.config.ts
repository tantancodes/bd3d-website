import { defineConfig } from '@playwright/test';

// Locally the suite uses the installed Google Chrome. CI (and machines without Chrome)
// set PLAYWRIGHT_CHANNEL="" to use Playwright's bundled Chromium.
const channel = process.env.PLAYWRIGHT_CHANNEL ?? 'chrome';

// Model readiness depends on the GPU. Software-rendered WebGL (CI, headless servers)
// measured 2.8–8.7 s per exhibit, so CI raises the assertion timeout via this variable.
const expectTimeout = Number(process.env.PLAYWRIGHT_EXPECT_TIMEOUT ?? 5000);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: Math.max(60000, expectTimeout * 4),
  expect: { timeout: expectTimeout },
  fullyParallel: false,
  workers: 1,
  // Software WebGL on shared CI runners is slow and variable; one retry separates timing
  // flakes (reported as "flaky") from real failures.
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3101',
    channel: channel || undefined,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_SOFTWARE_GL
      ? { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
      : undefined,
  },
  // On GitHub Actions, failures also become annotations on the commit.
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
});
