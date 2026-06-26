import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const DASHBOARD = join(ROOT, 'apps/dashboard/src')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Assistant01AHarness: Harness = {
  name: 'Assistant01AHarness',
  async run() {
    const errors: string[] = []

    const constants = read('packages/shared/src/constants/index.ts')
    if (!constants.includes("APP_NAME = 'WhatsApp Assistant'")) {
      errors.push('APP_NAME must be WhatsApp Assistant in shared/constants')
    }

    const envSchema = read('packages/shared/src/config/env.schema.ts')
    if (!envSchema.includes("'WhatsApp Assistant'")) {
      errors.push('env.schema APP_NAME default must be WhatsApp Assistant')
    }

    const rootPage = read('apps/dashboard/src/app/page.tsx')
    if (!rootPage.includes("redirect('/dashboard')") && !rootPage.includes('redirect("/dashboard")')) {
      errors.push('app/page.tsx must redirect to /dashboard')
    }

    const rootLayout = read('apps/dashboard/src/app/layout.tsx')
    if (!rootLayout.includes('WhatsApp Assistant')) {
      errors.push('root layout metadata must use WhatsApp Assistant')
    }

    const sidebar = read('apps/dashboard/src/components/layout/app-sidebar.tsx')
    for (const label of ['Dashboard', 'Mensagens', 'WhatsApp', 'Relatórios']) {
      if (!sidebar.includes(label)) {
        errors.push(`sidebar missing nav item: ${label}`)
      }
    }
    for (const hidden of ['Pipeline', 'Extrações', 'Despesas', 'Aprovações', 'Configurações']) {
      if (sidebar.includes(hidden)) {
        errors.push(`sidebar must not expose deprecated nav: ${hidden}`)
      }
    }

    const dashboardPage = read('apps/dashboard/src/app/dashboard/page.tsx')
    if (!dashboardPage.includes('DashboardAnalyticsView')) {
      errors.push('dashboard page must use DashboardAnalyticsView (real analytics)')
    }
    if (dashboardPage.includes('SUMMARY_PLACEHOLDERS')) {
      errors.push('dashboard must not use mock SUMMARY_PLACEHOLDERS')
    }

    const reportsPage = read('apps/dashboard/src/app/dashboard/reports/page.tsx')
    if (reportsPage.includes('Módulo em desenvolvimento')) {
      errors.push('reports page must not use Assistant-01A placeholder')
    }
    if (!reportsPage.includes('Relatórios')) {
      errors.push('reports page must render Relatórios UI')
    }

    const deprecatedRoutes = [
      'apps/dashboard/src/app/dashboard/pipeline/page.tsx',
      'apps/dashboard/src/app/dashboard/expenses/page.tsx',
      'apps/dashboard/src/app/dashboard/approvals/page.tsx',
    ]
    for (const route of deprecatedRoutes) {
      if (!existsSync(join(ROOT, route))) {
        errors.push(`deprecated route must still exist: ${route}`)
      }
    }

    const prismaSchema = read('packages/database/prisma/schema.prisma')
    if (prismaSchema.includes('model DailyReport')) {
      errors.push('Assistant-01A must not add Prisma models')
    }

    const specReadme = join(ROOT, 'specs/assistant-01a/README.md')
    if (!existsSync(specReadme)) {
      errors.push('Missing specs/assistant-01a/README.md')
    }

    return createResult(this.name, errors)
  },
}
