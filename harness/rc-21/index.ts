import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc21Harness: Harness = {
  name: 'Rc21Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-21-unc-path-launcher/README.md',
      'docs/adr/019-windows-unc-pushd-launcher.md',
      'docs/releases/rc-21-unc-launcher.md',
      'scripts/resolve-app-root.mjs',
      'scripts/resolve-app-root.test.mjs',
      'scripts/spawn-process.mjs',
      'scripts/spawn-process.test.mjs',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const bat = readFileSync(join(ROOT, 'Start WhatsApp Assistant.bat'), 'utf-8')
    if (!bat.includes('pushd')) errors.push('.bat must use pushd for UNC')
    if (!bat.includes('WA_APP_ROOT')) errors.push('.bat must set WA_APP_ROOT')
    if (!bat.includes('popd')) errors.push('.bat must popd before exit')

    const launch = readFileSync(join(ROOT, 'scripts/launch.mjs'), 'utf-8')
    if (!launch.includes('resolveAppRoot')) {
      errors.push('launch.mjs must use resolveAppRoot')
    }
    if (!launch.includes('WA_APP_ROOT')) {
      errors.push('launch.mjs must pass WA_APP_ROOT in env')
    }
    if (!launch.includes('spawnProcess')) {
      errors.push('launch.mjs must use spawnProcess for pnpm')
    }

    const spawnProcessFile = readFileSync(join(ROOT, 'scripts/spawn-process.mjs'), 'utf-8')
    if (!spawnProcessFile.includes('cmd.exe')) {
      errors.push('spawn-process.mjs must wrap .cmd via cmd.exe on Windows')
    }
    if (!launch.includes('App root:')) {
      errors.push('launch.mjs must log App root on boot')
    }

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    if (!readme.toLowerCase().includes('unc')) {
      errors.push('README must mention UNC network paths')
    }

    const manifest = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf-8')) as {
      version: string
    }
    if (manifest.version !== '1.5.3-rc21') {
      errors.push(`version.json must be 1.5.3-rc21 (got ${manifest.version})`)
    }

    const { isUncPath, resolveAppRoot } = await import('../../scripts/resolve-app-root.mjs')
    if (!isUncPath('\\\\server\\share')) {
      errors.push('isUncPath must detect \\\\server\\share')
    }

    const resolved = resolveAppRoot(
      `file:///${join(ROOT, 'scripts/launch.mjs').replace(/\\/g, '/')}`,
    )
    if (!existsSync(join(resolved, 'package.json'))) {
      errors.push('resolveAppRoot must resolve to repo root with package.json')
    }

    return createResult(this.name, errors)
  },
}

export const Rc21Harnesses = [Rc21Harness]
