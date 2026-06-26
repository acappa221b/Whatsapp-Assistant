import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc11SpecHarness: Harness = {
  name: 'Rc11SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-11-dashboard-reports-permissions/README.md',
      'specs/rc-11-dashboard-reports-permissions/acceptance-criteria.md',
      'docs/adr/011-token-usage-ledger.md',
      'docs/investigations/rc-11-dashboard-and-greetings.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const Rc11DashboardHarness: Harness = {
  name: 'Rc11DashboardHarness',
  async run() {
    const errors: string[] = []
    const page = read('apps/dashboard/src/app/dashboard/page.tsx')
    if (page.includes('SUMMARY_PLACEHOLDERS') || page.includes('PLACEHOLDERS')) {
      errors.push('Dashboard page must not use mock placeholders')
    }
    if (!existsSync(join(ROOT, 'apps/dashboard/src/app/api/dashboard/metrics/route.ts'))) {
      errors.push('Missing GET /api/dashboard/metrics route')
    }
    const permissions = read('apps/dashboard/src/components/permissions/chat-permissions-view.tsx')
    if (permissions.includes('aiProcessingEnabled')) {
      errors.push('Permissions UI must not expose aiProcessingEnabled column')
    }
    if (!permissions.includes('photoProcessingEnabled')) {
      errors.push('Permissions UI must include photoProcessingEnabled')
    }
    const greetings = read('packages/core/src/domains/agent-chat/application/should-auto-reply-to-message.ts')
    if (!greetings.includes('isGreetingMessage')) {
      errors.push('Missing isGreetingMessage in should-auto-reply-to-message.ts')
    }
    return createResult(this.name, errors)
  },
}

export const Rc11Harnesses = [Rc11SpecHarness, Rc11DashboardHarness]
