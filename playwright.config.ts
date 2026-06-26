import { defineConfig, devices } from '@playwright/test'
import { createConfigWithOverrides } from './packages/shared/src/config'

const sharedConfig = createConfigWithOverrides({
  OPENAI_API_KEY: 'playwright-placeholder',
})

export default defineConfig({
  testDir: './apps/dashboard/e2e',
  fullyParallel: true,
  forbidOnly: sharedConfig.app.isCi,
  retries: sharedConfig.app.isCi ? 2 : 0,
  workers: sharedConfig.app.isCi ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${sharedConfig.app.port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter @finance-ai/dashboard dev',
    url: `http://localhost:${sharedConfig.app.port}`,
    reuseExistingServer: !sharedConfig.app.isCi,
    timeout: 120_000,
  },
})
