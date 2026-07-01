import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc30Harness: Harness = {
  name: 'Rc30Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-30-reset-data-sync-chip/README.md',
      'docs/prompts/2026-07-01-rc-30-reset-data-sync-chip.md',
      'docs/investigations/permissions-sync-chip-ux.md',
      'packages/core/src/domains/whatsapp-data-reset/application/reset-whatsapp-data.use-case.ts',
      'packages/database/src/whatsapp-data-reset.ts',
      'apps/dashboard/src/app/api/settings/reset-whatsapp-data/route.ts',
      'apps/dashboard/src/app/api/whatsapp/sync-contacts/route.ts',
      'apps/dashboard/src/components/permissions/contact-sync-chip.tsx',
      'apps/dashboard/src/components/settings/whatsapp-data-reset-card.tsx',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const resetRoute = readFileSync(
      join(ROOT, 'apps/dashboard/src/app/api/settings/reset-whatsapp-data/route.ts'),
      'utf-8',
    )
    if (!resetRoute.includes("confirm !== 'RESETAR'")) {
      errors.push('reset-whatsapp-data must validate RESETAR confirmation')
    }

    const runtime = readFileSync(join(ROOT, 'apps/dashboard/src/lib/whatsapp/runtime.ts'), 'utf-8')
    if (!runtime.includes('runManualContactSync')) {
      errors.push('runtime must export runManualContactSync')
    }
    if (!runtime.includes('resetNameBootstrapFlag')) {
      errors.push('runtime must export resetNameBootstrapFlag')
    }
    const useCase = readFileSync(
      join(ROOT, 'packages/core/src/domains/whatsapp-data-reset/application/reset-whatsapp-data.use-case.ts'),
      'utf-8',
    )
    if (!useCase.includes('Dados resetados')) {
      errors.push('ResetWhatsappDataUseCase must log Dados resetados')
    }

    const tracker = readFileSync(
      join(ROOT, 'apps/dashboard/src/lib/whatsapp/contact-sync-tracker.ts'),
      'utf-8',
    )
    if (!tracker.includes('resetSyncStateForManualRun')) {
      errors.push('contact-sync-tracker must export resetSyncStateForManualRun')
    }

    const baileys = readFileSync(
      join(ROOT, 'packages/whatsapp/src/providers/baileys.provider.ts'),
      'utf-8',
    )
    if (!baileys.includes('reconnectForSync')) {
      errors.push('baileys provider must implement reconnectForSync')
    }

    const permissions = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/permissions/chat-permissions-view.tsx'),
      'utf-8',
    )
    if (permissions.includes('ContactSyncBanner')) {
      errors.push('chat-permissions-view must not use ContactSyncBanner')
    }
    if (!permissions.includes('ContactSyncChip')) {
      errors.push('chat-permissions-view must use ContactSyncChip inline with h1')
    }
    if (!permissions.includes('Iniciar sincronização')) {
      errors.push('chat-permissions-view must show manual sync button')
    }

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    if (!readme.includes('Resetar dados')) {
      errors.push('README must document WhatsApp data reset')
    }
    if (!readme.includes('Iniciar sincronização')) {
      errors.push('README must document manual sync')
    }

    const version = readFileSync(join(ROOT, 'version.json'), 'utf-8')
    if (!version.includes('1.7.4-rc30')) {
      errors.push('version.json must be 1.7.4-rc30')
    }

    return createResult(this.name, errors)
  },
}

export const Rc30Harnesses = [Rc30Harness]
