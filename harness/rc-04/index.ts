import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const MessageCaptureHarness: Harness = {
  name: 'MessageCaptureHarness',
  async run() {
    const errors: string[] = []
    const util = read('packages/whatsapp/src/utils/baileys-message.util.ts')
    if (util.includes('if (raw.key.fromMe) return null')) {
      errors.push('mapBaileysMessage must not discard fromMe messages')
    }
    if (!util.includes('export function mapBaileysMessage(')) {
      errors.push('mapBaileysMessage must always return MappedBaileysMessage')
    }
    if (!util.includes('rawPayload')) {
      errors.push('mapBaileysMessage must include rawPayload')
    }
    const provider = read('packages/whatsapp/src/providers/baileys.provider.ts')
    if (provider.includes('if (!mapped)')) {
      errors.push('baileys provider must not skip mapped messages')
    }
    if (!provider.includes('recordMessageReceived')) {
      errors.push('baileys provider must record received messages')
    }
    return createResult(this.name, errors)
  },
}

export const MessageClassificationHarness: Harness = {
  name: 'MessageClassificationHarness',
  async run() {
    const errors: string[] = []
    const classifier = read('packages/core/src/domains/message-archive/baileys-message-classifier.ts')
    for (const type of [
      'TEXT',
      'AUDIO',
      'IMAGE',
      'DOCUMENT',
      'VIDEO',
      'STICKER',
      'REACTION',
      'CONTACT',
      'LOCATION',
      'POLL',
      'SYSTEM',
      'UNKNOWN',
    ]) {
      if (!classifier.includes(`'${type}'`) && !classifier.includes(`"${type}"`)) {
        errors.push(`classifier missing type ${type}`)
      }
    }
    const enums = read('packages/core/src/domain/value-objects/whatsapp-enums.ts')
    if (!enums.includes("'VIDEO'")) {
      errors.push('MESSAGE_TYPES must include VIDEO and extended types')
    }
    return createResult(this.name, errors)
  },
}

export const MessagePersistenceHarness: Harness = {
  name: 'MessagePersistenceHarness',
  async run() {
    const errors: string[] = []
    const schema = read('packages/database/prisma/schema.prisma')
    if (!schema.includes('rawPayload')) {
      errors.push('WhatsappMessage must have rawPayload column')
    }
    if (!schema.includes('senderId')) {
      errors.push('WhatsappMessage must have senderId column')
    }
    if (!schema.includes('senderName')) {
      errors.push('WhatsappMessage must have senderName column')
    }
    const entity = read('packages/core/src/domains/whatsapp-message/domain/whatsapp-message.entity.ts')
    if (!entity.includes('rawPayload')) {
      errors.push('WhatsappMessage entity must include rawPayload')
    }
    return createResult(this.name, errors)
  },
}

export const MessageArchiveHarness: Harness = {
  name: 'MessageArchiveHarness',
  async run() {
    const errors: string[] = []
    const ui = read('apps/dashboard/src/components/messages/message-archive-view.tsx')
    if (!ui.includes('MessageArchiveView') && !ui.includes('archive/chats')) {
      errors.push('Message archive UI missing')
    }
    if (!ui.includes('lastMessagePreview')) {
      errors.push('Message archive UI must show chat previews')
    }
    const archiveApi = join(ROOT, 'apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts')
    if (!existsSync(archiveApi)) {
      errors.push('Missing GET /api/whatsapp/archive/chats')
    }
    const messagesPage = read('apps/dashboard/src/app/dashboard/messages/page.tsx')
    if (!messagesPage.includes('MessageArchiveView')) {
      errors.push('messages page must use MessageArchiveView')
    }
    return createResult(this.name, errors)
  },
}

export const MessageMetricsHarness: Harness = {
  name: 'MessageMetricsHarness',
  async run() {
    const errors: string[] = []
    const route = join(ROOT, 'apps/dashboard/src/app/api/whatsapp/metrics/route.ts')
    if (!existsSync(route)) {
      errors.push('Missing GET /api/whatsapp/metrics route')
    } else {
      const content = read('apps/dashboard/src/app/api/whatsapp/metrics/route.ts')
      if (!content.includes('lossRate')) {
        errors.push('metrics route must expose lossRate')
      }
    }
    const spec = join(ROOT, 'specs/rc-04-message-hardening/README.md')
    if (!existsSync(spec)) {
      errors.push('Missing specs/rc-04-message-hardening/README.md')
    }
    return createResult(this.name, errors)
  },
}

export const Rc04Harnesses = [
  MessageCaptureHarness,
  MessageClassificationHarness,
  MessagePersistenceHarness,
  MessageArchiveHarness,
  MessageMetricsHarness,
]
