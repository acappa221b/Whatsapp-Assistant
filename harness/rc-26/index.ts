import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc26Harness: Harness = {
  name: 'Rc26Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-26-fresh-clone-prisma-logs/README.md',
      'docs/investigations/fresh-clone-prisma-generate-skipped.md',
      'docs/prompts/2026-07-01-rc-26-fresh-clone-prisma-logs.md',
      'scripts/prisma-launcher.test.ts',
      'scripts/postinstall.mjs',
      'apps/dashboard/src/app/api/settings/logs/route.ts',
      'apps/dashboard/src/app/api/settings/logs/export/route.ts',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const launcher = readFileSync(join(ROOT, 'scripts/prisma-launcher.mjs'), 'utf-8')
    if (!launcher.includes('isGeneratedPrismaClientReady')) {
      errors.push('prisma-launcher must export isGeneratedPrismaClientReady')
    }
    if (launcher.includes('getPrismaClientEntry() || getPrismaEnginePath()')) {
      errors.push('prismaClientExists must not treat npm @prisma/client as generated client')
    }
    if (!launcher.includes('@prisma/client') || !launcher.includes('.prisma')) {
      errors.push('prisma-launcher must resolve pnpm .prisma/client via @prisma/client')
    }

    const launch = readFileSync(join(ROOT, 'scripts/launch.mjs'), 'utf-8')
    if (!launch.includes('isGeneratedPrismaClientReady')) {
      errors.push('launch.mjs must verify generated Prisma client after db:generate')
    }
    if (launch.includes('needsPrismaGenerate')) {
      errors.push('launch.mjs must not conditionally skip db:generate')
    }
    if (!launch.includes('/api/health/database')) {
      errors.push('launch.mjs must gate startup on /api/health/database')
    }

    const pkg = readFileSync(join(ROOT, 'package.json'), 'utf-8')
    if (!pkg.includes('postinstall')) {
      errors.push('package.json must define postinstall script')
    }

    const logsTab = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/settings/settings-logs-tab.tsx'),
      'utf-8',
    )
    if (!logsTab.includes('content-type')) {
      errors.push('settings-logs-tab must validate JSON content-type before parse')
    }

    const version = readFileSync(join(ROOT, 'version.json'), 'utf-8')
    if (!version.includes('1.7.')) {
      errors.push('version.json must be 1.7.x (RC-26 or newer)')
    }

    return createResult(this.name, errors)
  },
}

export const Rc26Harnesses = [Rc26Harness]
