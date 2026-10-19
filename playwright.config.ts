import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests (same setup as MPERPNG-20).
 *
 * Credentials are read from the environment, never committed:
 *
 *     # PowerShell
 *     $env:LINKS_USER='...'; $env:LINKS_PASS='...'; npm run e2e
 *
 *     # bash
 *     LINKS_USER=... LINKS_PASS=... npm run e2e
 *
 * auth.setup.ts logs in once and saves the session to
 * .playwright/state.json; every test reuses it, so the login form is filled
 * exactly once per run and only ever from those variables.
 *
 * Start the app first (npm start, port 8090) or point LINKS_BASE_URL elsewhere.
 */
export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: false,          // shared backend and one login session
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: '.playwright/report' }]],

  use: {
    baseURL: process.env.LINKS_BASE_URL ?? 'http://localhost:8090',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },

  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: '.playwright/state.json',
      },
    },
  ],
});
