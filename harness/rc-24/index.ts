import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc24Harness: Harness = {
  name: 'Rc24Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'docs/investigations/2026-06-30-false-update-available-version-parse.md',
      'docs/releases/rc-24-version-parse-fix.md',
      'packages/shared/src/version/compare-versions.mjs',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const compareTs = readFileSync(
      join(ROOT, 'packages/shared/src/version/compare-versions.ts'),
      'utf-8',
    )
    if (!compareTs.includes('[a-z]')) {
      errors.push('compare-versions.ts must support rc letter suffix')
    }
    if (compareTs.includes('major: 0, minor: 0, patch: 0')) {
      errors.push('compare-versions.ts must not silently return 0.0.0 on parse failure')
    }

    const compareMjs = readFileSync(join(ROOT, 'scripts/update/lib/compare-update.mjs'), 'utf-8')
    if (compareMjs.includes('-rc(\\d+))?$')) {
      errors.push('compare-update.mjs must not use legacy rc-only regex')
    }
    if (!compareMjs.includes('compare-versions.mjs')) {
      errors.push('compare-update.mjs must import shared compare-versions.mjs')
    }

    const checkUpdates = readFileSync(
      join(ROOT, 'apps/dashboard/src/lib/app/check-for-updates.ts'),
      'utf-8',
    )
    if (!checkUpdates.includes('parseVersion')) {
      errors.push('check-for-updates must use parseVersion defensively')
    }
    if (!checkUpdates.includes('localVersion')) {
      errors.push('check-for-updates cache must track localVersion')
    }

    const banner = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/layout/update-available-banner.tsx'),
      'utf-8',
    )
    if (!banner.includes('instalada:')) {
      errors.push('update banner must show installed version')
    }

    const { isNewerVersion } = await import('../../packages/shared/src/version/compare-versions.ts')
    if (isNewerVersion('1.5.3-rc21', '1.6.1-rc18b')) {
      errors.push('1.5.3-rc21 must not be newer than 1.6.1-rc18b')
    }
    if (!isNewerVersion('1.6.2-rc24', '1.6.1-rc18b')) {
      errors.push('1.6.2-rc24 must be newer than 1.6.1-rc18b')
    }

    return createResult(this.name, errors)
  },
}

export const Rc24Harnesses = [Rc24Harness]
