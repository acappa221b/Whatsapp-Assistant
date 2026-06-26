import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const EPIC08 = join(ROOT, 'specs/epic-08')

export const Epic08ReadinessHarness: Harness = {
  name: 'Epic08ReadinessHarness',
  async run() {
    const errors: string[] = []

    const readmePath = join(EPIC08, 'README.md')
    if (!existsSync(readmePath)) {
      errors.push('Missing specs/epic-08/README.md')
      return createResult(this.name, errors)
    }

    const readme = readFileSync(readmePath, 'utf-8')
    for (const phrase of [
      'Nao criar `Expense` ou `Revenue`',
      'WhatsApp',
      'Approval Queue',
      'Epic 09',
      'Approve All',
      'Reject All',
      'Banco continua como unica fonte de verdade',
      'Excel continua apenas como projecao/exportacao derivada',
    ]) {
      if (!readme.includes(phrase)) {
        errors.push(`Epic 08 README missing readiness phrase: ${phrase}`)
      }
    }

    return createResult(this.name, errors)
  },
}
