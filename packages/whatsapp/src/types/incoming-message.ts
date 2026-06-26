import type { MessageType } from '@finance-ai/core/domain/value-objects/whatsapp-enums'

export interface IncomingMessage {
  externalMessageId: string
  chatId: string
  chatName?: string | null
  sender: string
  senderId: string
  senderName?: string | null
  content: string
  messageType: MessageType
  rawPayload: Record<string, unknown>
  mediaUrl?: string | null
  mimeType?: string | null
  fileName?: string | null
  fileSize?: number | null
  storagePath?: string | null
  fromMe?: boolean
  receivedAt: Date
}
