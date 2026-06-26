import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const EVENTS = join(ROOT, 'packages/core/src/events/index.ts')
const PIPELINE = join(ROOT, 'packages/whatsapp/src/pipeline/whatsapp-message.pipeline.ts')

const REQUIRED_EVENTS = [
  'WhatsappConnected',
  'WhatsappDisconnected',
  'WhatsappMessageReceived',
  'WhatsappMessagePersisted',
  'WhatsappMessageFailed',
]

export const WhatsappEventHarness: Harness = {
  name: 'WhatsappEventHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(EVENTS)) {
      errors.push('Missing events index')
      return createResult(this.name, errors)
    }

    const content = readFileSync(EVENTS, 'utf-8')
    for (const eventName of REQUIRED_EVENTS) {
      if (!content.includes(eventName)) {
        errors.push(`Missing domain event: ${eventName}`)
      }
    }

    if (!existsSync(PIPELINE)) {
      errors.push('Missing WhatsappMessagePipeline')
    } else {
      const pipeline = readFileSync(PIPELINE, 'utf-8')
      if (!pipeline.includes('WhatsappMessageReceived')) {
        errors.push('Pipeline must handle WhatsappMessageReceived')
      }
      if (!pipeline.includes('WhatsappMessageFailed')) {
        errors.push('Pipeline must handle WhatsappMessageFailed')
      }
    }

    return createResult(this.name, errors)
  },
}
