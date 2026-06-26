import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from './types'
import { createResult } from './types'

const ROOT = join(import.meta.dirname, '..')
const DASHBOARD_APP = join(ROOT, 'apps/dashboard/src/app')

const REQUIRED_ROUTES = [
  'dashboard/page.tsx',
  'dashboard/expenses/page.tsx',
  'dashboard/approvals/page.tsx',
  'dashboard/reports/page.tsx',
  'dashboard/settings/page.tsx',
]

export const ApiHarness: Harness = {
  name: 'ApiHarness',
  async run() {
    const errors: string[] = []
    const healthRoute = join(DASHBOARD_APP, 'api/health/route.ts')
    if (!existsSync(healthRoute)) {
      errors.push('Missing API health route: apps/dashboard/src/app/api/health/route.ts')
    }
    return createResult(this.name, errors)
  },
}

export const UIHarness: Harness = {
  name: 'UIHarness',
  async run() {
    const errors: string[] = []
    for (const route of REQUIRED_ROUTES) {
      if (!existsSync(join(DASHBOARD_APP, route))) {
        errors.push(`Missing dashboard route: ${route}`)
      }
    }
    return createResult(this.name, errors)
  },
}
