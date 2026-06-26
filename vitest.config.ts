import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { coverageExclude, coverageInclude, coverageThresholds } from './config/coverage'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    server: {
      deps: {
        inline: ['@finance-ai/core', '@finance-ai/shared', '@finance-ai/database'],
        external: ['@whiskeysockets/baileys', 'pino', 'sharp', 'qrcode'],
      },
    },
    include: [
      'packages/**/src/**/*.test.ts',
      'packages/**/tests/**/*.test.ts',
      'apps/dashboard/src/**/*.test.ts',
    ],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 2,
    coverage: {
      provider: 'v8',
      all: false,
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: [...coverageInclude],
      exclude: [...coverageExclude],
      thresholds: { ...coverageThresholds },
    },
  },
  resolve: {
    alias: {
      '@finance-ai/core': path.resolve(__dirname, 'packages/core/src'),
      '@finance-ai/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@finance-ai/database': path.resolve(__dirname, 'packages/database/src'),
      '@finance-ai/whatsapp': path.resolve(__dirname, 'packages/whatsapp/src'),
      '@finance-ai/ai': path.resolve(__dirname, 'packages/ai/src'),
      '@finance-ai/excel': path.resolve(__dirname, 'packages/excel/src'),
      '@finance-ai/audit': path.resolve(__dirname, 'packages/audit/src'),
      '@': path.resolve(__dirname, 'apps/dashboard/src'),
    },
  },
})
