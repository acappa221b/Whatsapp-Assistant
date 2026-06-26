import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const DOMAIN = join(ROOT, 'packages/core/src/domains/extraction')
const EVENTS = join(ROOT, 'packages/core/src/events/index.ts')
const EXTRACTIONS_PAGE = join(ROOT, 'apps/dashboard/src/app/dashboard/extractions/page.tsx')

const REQUIRED_EVENTS = ['ExtractionCreated', 'ExtractionFailed', 'ExtractionRejected']

export const ExtractionHarness: Harness = {
  name: 'ExtractionHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(join(DOMAIN, 'index.ts'))) {
      errors.push('Missing extraction domain index')
      return createResult(this.name, errors)
    }

    for (const file of [
      join(DOMAIN, 'domain/ai-extraction-provider.ts'),
      join(DOMAIN, 'domain/extraction.entity.ts'),
      join(DOMAIN, 'application/extraction.use-cases.ts'),
    ]) {
      if (!existsSync(file)) {
        errors.push(`Missing extraction file: ${file.replace(ROOT + '\\', '')}`)
      }
    }

    const events = readFileSync(EVENTS, 'utf-8')
    for (const eventName of REQUIRED_EVENTS) {
      if (!events.includes(eventName)) {
        errors.push(`Missing domain event: ${eventName}`)
      }
    }

    if (!existsSync(EXTRACTIONS_PAGE)) {
      errors.push('Missing /dashboard/extractions page')
    }

    return createResult(this.name, errors)
  },
}
