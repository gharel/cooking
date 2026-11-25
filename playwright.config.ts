import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT_E2E ?? 4182);
const ADRESSE = `http://localhost:${PORT}/cooking/`;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: ADRESSE, trace: 'retain-on-failure' },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: ADRESSE,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /iphone/ },
    { name: 'iphone', use: { ...devices['iPhone 13'] }, testMatch: /iphone/ },
  ],
});
