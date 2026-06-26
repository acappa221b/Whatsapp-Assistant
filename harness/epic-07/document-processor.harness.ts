import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const PROCESSORS = join(
  ROOT,
  'packages/core/src/domains/message-processing/infrastructure/processors/stub-processors.ts',
)

export const DocumentProcessorHarness: Harness = {
  name: 'DocumentProcessorHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(PROCESSORS)) {
      errors.push('Missing processors file')
      return createResult(this.name, errors)
    }

    const content = readFileSync(PROCESSORS, 'utf-8')
    for (const required of ['DocumentMessageProcessor', 'downloadDocument', 'system-media-validator']) {
      if (!content.includes(required)) {
        errors.push(`Document processor missing: ${required}`)
      }
    }

    return createResult(this.name, errors)
  },
}
