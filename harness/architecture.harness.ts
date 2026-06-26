import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from './types'
import { createResult } from './types'

const ROOT = join(import.meta.dirname, '..')

const REQUIRED_PATHS = [
  'apps/dashboard',
  'packages/core',
  'packages/shared',
  'packages/database',
  'packages/whatsapp',
  'packages/ai',
  'packages/excel',
  'packages/audit',
  'specs/epic-01',
  'docs/architecture',
  'docs/adr',
  'docker',
  'harness',
  'ROADMAP.md',
  '.github/workflows/ci.yml',
  'docs/adr/004-soft-delete.md',
  'packages/shared/README.md',
  'commitlint.config.js',
  'config/coverage.ts',
]

export const ArchitectureHarness: Harness = {
  name: 'ArchitectureHarness',
  async run() {
    const errors: string[] = []
    for (const path of REQUIRED_PATHS) {
      if (!existsSync(join(ROOT, path))) {
        errors.push(`Missing required path: ${path}`)
      }
    }
    return createResult(this.name, errors)
  },
}
