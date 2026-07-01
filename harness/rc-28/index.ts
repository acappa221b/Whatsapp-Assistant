import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc28Harness: Harness = {
  name: 'Rc28Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-28-outbound-queue-permissions-sync/README.md',
      'docs/prompts/2026-07-01-rc-28-outbound-queue-permissions-sync.md',
      'apps/dashboard/src/hooks/use-message-send-queue.ts',
      'apps/dashboard/src/hooks/use-message-send-queue.test.ts',
      'apps/dashboard/src/lib/whatsapp/contact-sync-tracker.ts',
      'apps/dashboard/src/app/api/whatsapp/sync-status/route.ts',
      'apps/dashboard/src/components/permissions/contact-sync-banner.tsx',
      'apps/dashboard/src/components/messages/outbound-message-bubble.tsx',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const archiveView = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/messages/message-archive-view.tsx'),
      'utf-8',
    )
    if (archiveView.includes('disabled={!selectedChatId || !whatsappConnected || sending}')) {
      errors.push('message-archive-view must not disable composer with sending state')
    }
    if (!archiveView.includes('useMessageSendQueue')) {
      errors.push('message-archive-view must use useMessageSendQueue')
    }

    const permissions = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/permissions/chat-permissions-view.tsx'),
      'utf-8',
    )
    if (!permissions.includes('ContactSyncBanner')) {
      errors.push('chat-permissions-view must render ContactSyncBanner')
    }

    const runtime = readFileSync(join(ROOT, 'apps/dashboard/src/lib/whatsapp/runtime.ts'), 'utf-8')
    if (!runtime.includes("Contato sincronizado")) {
      errors.push('runtime must log Contato sincronizado')
    }
    if (!runtime.includes('onHistorySyncProgress')) {
      errors.push('runtime must wire onHistorySyncProgress')
    }

    const factory = readFileSync(
      join(ROOT, 'packages/whatsapp/src/providers/baileys-socket.factory.ts'),
      'utf-8',
    )
    if (!factory.includes('onHistorySyncProgress')) {
      errors.push('baileys-socket.factory must expose onHistorySyncProgress')
    }

    const version = readFileSync(join(ROOT, 'version.json'), 'utf-8')
    if (!version.includes('1.7.3-rc28')) {
      errors.push('version.json must be 1.7.3-rc28')
    }

    return createResult(this.name, errors)
  },
}

export const Rc28Harnesses = [Rc28Harness]
