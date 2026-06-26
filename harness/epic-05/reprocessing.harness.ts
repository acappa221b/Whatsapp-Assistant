import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const USE_CASES = join(
  ROOT,
  'packages/core/src/domains/message-processing/application/message-processing.use-cases.ts',
)
const REQUEUE_API = join(ROOT, 'apps/dashboard/src/app/api/pipeline/jobs/[messageId]/requeue/route.ts')

export const ReprocessingHarness: Harness = {
  name: 'ReprocessingHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(USE_CASES)) {
      errors.push('Missing message-processing use cases')
      return createResult(this.name, errors)
    }

    const useCases = readFileSync(USE_CASES, 'utf-8')
    if (!useCases.includes('RequeueMessageUseCase')) {
      errors.push('Missing RequeueMessageUseCase')
    }
    if (!useCases.includes('resetForRequeue')) {
      errors.push('Requeue must reset job state')
    }

    if (!existsSync(REQUEUE_API)) {
      errors.push('Missing POST /api/pipeline/jobs/[messageId]/requeue')
    }

    return createResult(this.name, errors)
  },
}
