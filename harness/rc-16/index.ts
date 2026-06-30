import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc16Harness: Harness = {
  name: 'Rc16Harness',
  async run() {
    const errors: string[] = []

    const factory = readFileSync(
      join(ROOT, 'packages/whatsapp/src/providers/baileys-socket.factory.ts'),
      'utf-8',
    )
    if (!factory.includes('messaging-history.set')) {
      errors.push('baileys-socket.factory must listen to messaging-history.set')
    }
    if (!factory.includes('shouldProcessMessageUpsert')) {
      errors.push('baileys-socket.factory must gate messages.upsert by type')
    }
    if (!factory.includes('syncHistoryChats')) {
      errors.push('baileys-socket.factory must sync chats from history payload')
    }

    const diagnosticsRoute = join(ROOT, 'apps/dashboard/src/app/api/whatsapp/diagnostics/route.ts')
    if (!existsSync(diagnosticsRoute)) {
      errors.push('Missing GET /api/whatsapp/diagnostics route')
    } else {
      const route = readFileSync(diagnosticsRoute, 'utf-8')
      if (!route.includes('getWhatsappDiagnostics')) {
        errors.push('diagnostics route must call getWhatsappDiagnostics')
      }
    }

    const panel = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/whatsapp/whatsapp-connection-panel.tsx'),
      'utf-8',
    )
    if (!panel.includes('liveMessageCount')) {
      errors.push('WhatsappConnectionPanel must show liveMessageCount')
    }
    if (!panel.includes('nenhuma mensagem nova foi recebida')) {
      errors.push('WhatsappConnectionPanel must warn when connected without live messages')
    }

    const permissions = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/permissions/chat-permissions-view.tsx'),
      'utf-8',
    )
    if (!permissions.includes('mensagem de teste')) {
      errors.push('Permissions view must explain empty chat list')
    }

    const messages = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/messages/message-archive-view.tsx'),
      'utf-8',
    )
    if (!messages.includes('Habilite os chats em Permissoes')) {
      errors.push('Messages view must explain archiveEnabled requirement')
    }

    const investigation = join(ROOT, 'docs/investigations/iphone-linked-device-no-messages.md')
    if (!existsSync(investigation)) {
      errors.push('Missing iphone-linked-device-no-messages investigation doc')
    }

    return createResult(this.name, errors)
  },
}

export const Rc16Harnesses = [Rc16Harness]
