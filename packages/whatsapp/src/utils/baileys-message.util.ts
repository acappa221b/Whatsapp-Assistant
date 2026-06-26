import type { MessageType } from '@finance-ai/core/domain/value-objects/whatsapp-enums'
import {
  classifyBaileysContent,
  unwrapBaileysMessage,
  unwrapMessageContent,
  type BaileysMessageContent,
} from '@finance-ai/core/domains/message-archive'
import {
  recordMessageMapped,
  recordUnknownPayloadKeys,
} from '../metrics/capture-metrics'
import type { ContactNameResolver } from './contact-name-resolver'

export { unwrapMessageContent } from '@finance-ai/core/domains/message-archive'

type Long = { toNumber?: () => number }

export type RawBaileysMessage = {
  key: {
    id?: string
    remoteJid?: string
    fromMe?: boolean
    participant?: string
  }
  message?: BaileysMessageContent
  messageTimestamp?: number | Long
  pushName?: string
}

export type MappedBaileysMessage = {
  externalMessageId: string
  chatId: string
  chatName: string | null
  sender: string
  senderId: string
  senderName: string | null
  content: string
  messageType: MessageType
  rawPayload: Record<string, unknown>
  mediaUrl: string | null
  mimeType: string | null
  fileName: string | null
  fileSize: number | null
  storagePath: string | null
  fromMe: boolean
  receivedAt: Date
}

export function mapBaileysMessage(
  raw: RawBaileysMessage,
  options?: { resolver?: ContactNameResolver },
): MappedBaileysMessage {
  const fromMe = raw.key.fromMe ?? false
  const externalMessageId = raw.key.id?.trim() || buildSyntheticId(raw)
  const chatId = raw.key.remoteJid?.trim() || 'unknown@unknown'
  const senderId = raw.key.participant?.trim() || chatId
  let senderName = raw.pushName?.trim() || null
  let chatName: string | null = null

  if (options?.resolver) {
    const resolved = options.resolver.resolveForMessage(raw)
    chatName = resolved.chatName
    senderName = resolved.senderName ?? senderName
  }

  const sender = senderName ?? senderId

  const classified = classifyBaileysContent({ message: raw.message })
  const messageType = classified.messageType as MessageType

  const unwrap = unwrapBaileysMessage(raw.message as BaileysMessageContent | undefined)
  recordMessageMapped(unwrap.wrappers)
  if (messageType === 'UNKNOWN' && unwrap.message) {
    recordUnknownPayloadKeys(Object.keys(unwrap.message).filter((k) => !k.startsWith('_')))
  }

  const timestamp = raw.messageTimestamp
  const receivedAt =
    typeof timestamp === 'number'
      ? new Date(timestamp * 1000)
      : timestamp && typeof timestamp.toNumber === 'function'
        ? new Date(timestamp.toNumber() * 1000)
        : new Date()

  return {
    externalMessageId,
    chatId,
    chatName,
    sender,
    senderId,
    senderName,
    content: classified.content,
    messageType,
    rawPayload: serializeRawPayload(raw),
    mediaUrl: classified.mediaUrl,
    mimeType: classified.mimeType,
    fileName: classified.fileName,
    fileSize: classified.fileSize,
    storagePath: null,
    fromMe,
    receivedAt,
  }
}

function buildSyntheticId(raw: RawBaileysMessage): string {
  const seed = JSON.stringify({
    chatId: raw.key.remoteJid,
    participant: raw.key.participant,
    ts: raw.messageTimestamp,
    keys: raw.message ? Object.keys(unwrapMessageContent(raw.message) ?? {}) : [],
  })
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return `synthetic-${Math.abs(hash)}`
}

function serializeRawPayload(raw: RawBaileysMessage): Record<string, unknown> {
  return JSON.parse(JSON.stringify(raw)) as Record<string, unknown>
}
