import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const QUEUE_INTERFACE = join(
  ROOT,
  'packages/core/src/domains/message-processing/domain/message-processing-queue.ts',
)
const QUEUE_IMPL = join(
  ROOT,
  'packages/core/src/domains/message-processing/infrastructure/in-memory-message-processing-queue.ts',
)

export const QueueHarness: Harness = {
  name: 'QueueHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(QUEUE_INTERFACE)) {
      errors.push('Missing MessageProcessingQueue interface')
      return createResult(this.name, errors)
    }

    const iface = readFileSync(QUEUE_INTERFACE, 'utf-8')
    for (const method of ['enqueue', 'dequeue', 'requeue', 'list']) {
      if (!iface.includes(method)) {
        errors.push(`MessageProcessingQueue must define ${method}`)
      }
    }

    if (!existsSync(QUEUE_IMPL)) {
      errors.push('Missing InMemoryMessageProcessingQueue')
    } else {
      const impl = readFileSync(QUEUE_IMPL, 'utf-8')
      if (!impl.includes('InMemoryMessageProcessingQueue')) {
        errors.push('In-memory queue implementation not found')
      }
    }

    return createResult(this.name, errors)
  },
}
