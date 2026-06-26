import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const DOMAIN = join(ROOT, 'packages/core/src/domains/message-processing')
const PIPELINE = join(DOMAIN, 'application/message-processing.pipeline.ts')
const EVENTS = join(ROOT, 'packages/core/src/events/index.ts')

const REQUIRED_EVENTS = [
  'MessageQueued',
  'MessageProcessingStarted',
  'MessageProcessed',
  'MessageFailed',
  'MessageSkipped',
]

export const MessagePipelineHarness: Harness = {
  name: 'MessagePipelineHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(PIPELINE)) {
      errors.push('Missing MessageProcessingPipeline')
      return createResult(this.name, errors)
    }

    const dashboardPage = join(ROOT, 'apps/dashboard/src/app/dashboard/pipeline/page.tsx')
    if (!existsSync(dashboardPage)) {
      errors.push('Missing /dashboard/pipeline page')
    }

    const pipeline = readFileSync(PIPELINE, 'utf-8')
    if (!pipeline.includes('WhatsappMessagePersisted')) {
      errors.push('Pipeline must subscribe to WhatsappMessagePersisted')
    }
    if (!pipeline.includes('ProcessMessageUseCase') && !pipeline.includes('processMessageUseCase')) {
      errors.push('Pipeline must trigger message processing')
    }

    const events = readFileSync(EVENTS, 'utf-8')
    for (const eventName of REQUIRED_EVENTS) {
      if (!events.includes(eventName)) {
        errors.push(`Missing domain event: ${eventName}`)
      }
    }

    return createResult(this.name, errors)
  },
}
