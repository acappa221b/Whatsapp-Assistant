import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const APP = join(ROOT, 'apps/dashboard/src/app')

const REQUIRED_ROUTES = [
  'dashboard/messages/page.tsx',
  'dashboard/whatsapp/page.tsx',
  'api/whatsapp/status/route.ts',
  'api/whatsapp/connect/route.ts',
  'api/whatsapp/disconnect/route.ts',
  'api/whatsapp/messages/route.ts',
  'api/whatsapp/events/route.ts',
]

export const WhatsappDashboardHarness: Harness = {
  name: 'WhatsappDashboardHarness',
  async run() {
    const errors: string[] = []

    for (const route of REQUIRED_ROUTES) {
      if (!existsSync(join(APP, route))) {
        errors.push(`Missing dashboard/API route: ${route}`)
      }
    }

    return createResult(this.name, errors)
  },
}
