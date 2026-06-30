import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc18bHarness: Harness = {
  name: 'Rc18bHarness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-18b-launcher-auto-update-complete/README.md',
      'docs/adr/021-dual-channel-github-auto-update.md',
      'docs/investigations/2026-06-30-zip-user-no-auto-update.md',
      'docs/releases/rc-18b-auto-update-complete.md',
      'packages/shared/src/update/index.ts',
      'scripts/update/index.mjs',
      'scripts/update/update-via-zip.mjs',
      'scripts/update/apply-overlay.mjs',
      'scripts/update/rollback-update.mjs',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const protectedPaths = readFileSync(
      join(ROOT, 'packages/shared/src/update/protected-paths.ts'),
      'utf-8',
    )
    if (!protectedPaths.includes("'storage'")) {
      errors.push('USER_DATA_PATHS must include storage')
    }
    if (!protectedPaths.includes('*.db')) {
      errors.push('USER_DATA_PATHS must include *.db')
    }

    const launch = readFileSync(join(ROOT, 'scripts/launch.mjs'), 'utf-8')
    if (!launch.includes('runAutoUpdate')) {
      errors.push('launch.mjs must use runAutoUpdate from scripts/update')
    }

    const banner = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/layout/update-available-banner.tsx'),
      'utf-8',
    )
    if (banner.includes('baixe') && banner.includes('manualmente')) {
      errors.push('banner must not tell zip users to download manually when zip_overlay exists')
    }
    if (!banner.includes('Start WhatsApp Assistant.bat')) {
      errors.push('banner must mention .bat restart for auto-update')
    }

    const about = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/settings/settings-about-section.tsx'),
      'utf-8',
    )
    if (!about.includes('Como atualizar')) {
      errors.push('SettingsAboutSection must include Como atualizar help')
    }

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    if (!readme.includes('## Como atualizar')) {
      errors.push('README must have Como atualizar section')
    }
    if (!readme.includes('storage/')) {
      errors.push('README Como atualizar must mention preserved storage/')
    }

    const promptUpdate = readFileSync(join(ROOT, 'scripts/update/prompt-update.mjs'), 'utf-8')
    if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(promptUpdate)) {
      errors.push('prompt-update must use ASCII-only messages for CMD')
    }

    const { USER_DATA_PATHS } = await import('../../packages/shared/src/update/protected-paths.ts')
    if (!USER_DATA_PATHS.some((p) => p === 'storage')) {
      errors.push('shared USER_DATA_PATHS must list storage')
    }

    return createResult(this.name, errors)
  },
}

export const Rc18bHarnesses = [Rc18bHarness]
