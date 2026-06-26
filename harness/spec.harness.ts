import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from './types'
import { createResult } from './types'

const ROOT = join(import.meta.dirname, '..')
const SPECS = join(ROOT, 'specs')

export const SpecHarness: Harness = {
  name: 'SpecHarness',
  async run() {
    const errors: string[] = []
    const epics = readdirSync(SPECS, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('epic-'))
      .map((d) => d.name)

    if (epics.length < 3) {
      errors.push('Expected at least 3 epic spec folders')
    }

    for (const epic of epics) {
      const readme = join(SPECS, epic, 'README.md')
      if (!existsSync(readme)) {
        errors.push(`Missing spec README: specs/${epic}/README.md`)
      }
      if (epic === 'epic-02' && !existsSync(join(SPECS, epic, 'test-matrix.md'))) {
        errors.push('Missing specs/epic-02/test-matrix.md')
      }
      if (epic === 'epic-assistant-01' && !existsSync(join(SPECS, epic, 'test-matrix.md'))) {
        errors.push('Missing specs/epic-assistant-01/test-matrix.md')
      }
    }

    if (!epics.includes('epic-assistant-01')) {
      errors.push('Missing specs/epic-assistant-01/ folder')
    }

    const assistant01a = join(SPECS, 'assistant-01a')
    if (!existsSync(join(assistant01a, 'README.md'))) {
      errors.push('Missing specs/assistant-01a/README.md')
    }
    if (!existsSync(join(assistant01a, 'acceptance-criteria.md'))) {
      errors.push('Missing specs/assistant-01a/acceptance-criteria.md')
    }

    const rc04 = join(SPECS, 'rc-04-message-hardening')
    if (!existsSync(join(rc04, 'README.md'))) {
      errors.push('Missing specs/rc-04-message-hardening/README.md')
    }
    if (!existsSync(join(rc04, 'acceptance-criteria.md'))) {
      errors.push('Missing specs/rc-04-message-hardening/acceptance-criteria.md')
    }

    const rc05 = join(SPECS, 'rc-05-runtime-refresh')
    if (!existsSync(join(rc05, 'README.md'))) {
      errors.push('Missing specs/rc-05-runtime-refresh/README.md')
    }
    if (!existsSync(join(rc05, 'acceptance-criteria.md'))) {
      errors.push('Missing specs/rc-05-runtime-refresh/acceptance-criteria.md')
    }

    return createResult(this.name, errors)
  },
}
