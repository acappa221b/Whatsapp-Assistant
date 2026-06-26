import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const PROVIDER = join(ROOT, 'packages/whatsapp/src/providers/baileys.provider.ts')
const INDEX = join(ROOT, 'packages/whatsapp/src/index.ts')

const REQUIRED_METHODS = ['connect', 'disconnect', 'getStatus', 'onMessage', 'onStatusChange']

export const WhatsappProviderHarness: Harness = {
  name: 'WhatsappProviderHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(PROVIDER)) {
      errors.push('Missing BaileysWhatsappProvider')
      return createResult(this.name, errors)
    }

    const providerContent = readFileSync(PROVIDER, 'utf-8')
    if (!providerContent.includes('class BaileysWhatsappProvider')) {
      errors.push('BaileysWhatsappProvider class not found')
    }

    const indexContent = readFileSync(INDEX, 'utf-8')
    for (const method of REQUIRED_METHODS) {
      if (!indexContent.includes(method)) {
        errors.push(`WhatsappProvider missing method: ${method}`)
      }
    }

    return createResult(this.name, errors)
  },
}
