import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc18Harness: Harness = {
  name: 'Rc18Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'version.json',
      'specs/rc-18-version-display-auto-update/README.md',
      'docs/adr/017-launcher-git-auto-update.md',
      'packages/shared/src/version/read-app-version.ts',
      'packages/shared/src/version/compare-versions.ts',
      'scripts/auto-update.mjs',
      'apps/dashboard/src/app/api/app/version/route.ts',
      'apps/dashboard/src/components/layout/app-version-bar.tsx',
      'apps/dashboard/src/components/layout/update-available-banner.tsx',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const manifest = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf-8')) as {
      version: string
    }
    const reader = readFileSync(
      join(ROOT, 'packages/shared/src/version/read-app-version.ts'),
      'utf-8',
    )
    if (!reader.includes('version.json')) {
      errors.push('read-app-version must read version.json')
    }

    const launch = readFileSync(join(ROOT, 'scripts/launch.mjs'), 'utf-8')
    if (!launch.includes('auto-update') || !launch.includes('autoUpdate')) {
      errors.push('launch.mjs must call autoUpdate')
    }

    const autoUpdate = readFileSync(join(ROOT, 'scripts/auto-update.mjs'), 'utf-8')
    if (!autoUpdate.includes('git pull --ff-only')) {
      errors.push('auto-update must use git pull --ff-only')
    }

    const sidebar = readFileSync(join(ROOT, 'apps/dashboard/src/components/layout/app-sidebar.tsx'), 'utf-8')
    if (/v\d+\.\d+\.\d+-rc\d+/.test(sidebar)) {
      errors.push('sidebar must not hardcode version string')
    }

    const layout = readFileSync(join(ROOT, 'apps/dashboard/src/app/dashboard/layout.tsx'), 'utf-8')
    if (!layout.includes('AppVersionBar')) {
      errors.push('dashboard layout must include AppVersionBar')
    }

    const { getAppVersion } = await import('../../packages/shared/src/version/read-app-version.ts')
    if (getAppVersion() !== manifest.version) {
      errors.push('getAppVersion() must match version.json')
    }

    return createResult(this.name, errors)
  },
}

export const Rc18Harnesses = [Rc18Harness]
