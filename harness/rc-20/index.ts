import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc20Harness: Harness = {
  name: 'Rc20Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-20-settings-logs-tab/README.md',
      'docs/adr/018-centralized-app-logging.md',
      'docs/releases/rc-20-settings-logs-tab.md',
      'packages/database/prisma/schema.prisma',
      'packages/shared/src/logging/app-logger.ts',
      'apps/dashboard/src/instrumentation.ts',
      'apps/dashboard/src/lib/logging/console-hook.ts',
      'apps/dashboard/src/app/api/settings/logs/route.ts',
      'apps/dashboard/src/components/settings/settings-logs-tab.tsx',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const schema = readFileSync(join(ROOT, 'packages/database/prisma/schema.prisma'), 'utf-8')
    if (!schema.includes('model AppLog')) errors.push('schema must define AppLog')

    const settings = readFileSync(join(ROOT, 'apps/dashboard/src/app/dashboard/settings/page.tsx'), 'utf-8')
    if (!settings.includes("'logs'") || !settings.includes('SettingsLogsTab')) {
      errors.push('settings page must include Logs tab')
    }

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    if (!readme.toLowerCase().includes('logs')) {
      errors.push('README must mention Logs tab')
    }

    const manifest = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf-8')) as {
      version: string
    }
    if (!manifest.version.includes('rc20') && !manifest.version.startsWith('1.5.')) {
      errors.push('version.json should reflect RC-20 or newer')
    }

    const { sanitizeLogMessage } = await import('../../packages/shared/src/logging/app-logger.ts')
    if (!sanitizeLogMessage('sk-abcdefghijklmnop').includes('sk-****')) {
      errors.push('sanitizeLogMessage must mask secrets')
    }

    return createResult(this.name, errors)
  },
}

export const Rc20Harnesses = [Rc20Harness]
