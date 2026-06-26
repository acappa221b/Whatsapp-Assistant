import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const EVENTS_ROUTE = join(ROOT, 'apps/dashboard/src/app/api/whatsapp/events/route.ts')
const WHATSAPP_PAGE = join(ROOT, 'apps/dashboard/src/app/dashboard/whatsapp/page.tsx')
const ADR = join(ROOT, 'docs/adr/005-whatsapp-qr-sse.md')

export const QrCodeHarness: Harness = {
  name: 'QrCodeHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(EVENTS_ROUTE)) {
      errors.push('Missing SSE route: /api/whatsapp/events')
    } else {
      const content = readFileSync(EVENTS_ROUTE, 'utf-8')
      if (!content.includes('text/event-stream')) {
        errors.push('SSE route must use text/event-stream')
      }
      if (!content.includes('qrCodeDataUrl')) {
        errors.push('SSE payload must include qrCodeDataUrl')
      }
    }

    if (!existsSync(WHATSAPP_PAGE)) {
      errors.push('Missing /dashboard/whatsapp page')
    } else {
      const page = readFileSync(WHATSAPP_PAGE, 'utf-8')
      if (!page.includes('EventSource')) {
        errors.push('WhatsApp page must consume EventSource for QR updates')
      }
    }

    if (!existsSync(ADR)) {
      errors.push('Missing ADR-005 for QR update strategy')
    }

    return createResult(this.name, errors)
  },
}
