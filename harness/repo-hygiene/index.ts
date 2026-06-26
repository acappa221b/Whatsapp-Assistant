import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const RepoHygieneHarness: Harness = {
  name: 'RepoHygieneHarness',
  async run() {
    const errors: string[] = []

    const gitignorePath = join(ROOT, '.gitignore')
    if (!existsSync(gitignorePath)) {
      errors.push('Missing .gitignore')
      return createResult(this.name, errors)
    }

    const gitignore = readFileSync(gitignorePath, 'utf-8')
    for (const rule of ['storage/', 'backups/', '*.db', '.env']) {
      if (!gitignore.includes(rule)) {
        errors.push(`.gitignore must contain ${rule}`)
      }
    }

    if (!existsSync(join(ROOT, 'scripts/validate-no-runtime-data.mjs'))) {
      errors.push('Missing scripts/validate-no-runtime-data.mjs')
    }

    const pkg = readFileSync(join(ROOT, 'package.json'), 'utf-8')
    if (!pkg.includes('validate:repo-hygiene')) {
      errors.push('package.json must define validate:repo-hygiene script')
    }

    return createResult(this.name, errors)
  },
}

export const RepoHygieneHarnesses = [RepoHygieneHarness]
