import type { WhatsappMessage as PrismaWhatsappMessage, Prisma } from '@prisma/client'
import { WhatsappMessage } from '@finance-ai/core/domains/whatsapp-message'
import type { MessageType } from '@finance-ai/core/domain/value-objects/whatsapp-enums'

type PrismaWhatsappMessageRecord = PrismaWhatsappMessage

export type WhatsappMessagePersistence = {
  id: string
  externalMessageId: string
  chatId: string
  chatName: string | null
  sender: string
  senderId: string
  senderName: string | null
  content: string
  messageType: MessageType
  rawPayload: Prisma.InputJsonValue
  mediaUrl: string | null
  mimeType: string | null
  fileName: string | null
  fileSize: number | null
  storagePath: string | null
  fromMe: boolean
  sourceAgent: boolean
  processed: boolean
  receivedAt: Date
  createdAt: Date
}

export const WhatsappMessageMapper = {
  toDomain(record: PrismaWhatsappMessageRecord): WhatsappMessage {
    return WhatsappMessage.reconstitute({
      id: record.id,
      externalMessageId: record.externalMessageId,
      chatId: record.chatId,
      chatName: record.chatName,
      sender: record.sender,
      senderId: record.senderId,
      senderName: record.senderName,
      content: record.content,
      messageType: record.messageType as MessageType,
      rawPayload: (record.rawPayload ?? {}) as Record<string, unknown>,
      mediaUrl: record.mediaUrl,
      mimeType: record.mimeType,
      fileName: record.fileName,
      fileSize: record.fileSize,
      storagePath: record.storagePath,
      fromMe: record.fromMe,
      sourceAgent: record.sourceAgent,
      processed: record.processed,
      receivedAt: record.receivedAt,
      createdAt: record.createdAt,
    })
  },

  toPersistence(message: WhatsappMessage): WhatsappMessagePersistence {
    return {
      id: message.id,
      externalMessageId: message.externalMessageId,
      chatId: message.chatId,
      chatName: message.chatName,
      sender: message.sender,
      senderId: message.senderId,
      senderName: message.senderName,
      content: message.content,
      messageType: message.messageType,
      rawPayload: message.rawPayload as Prisma.InputJsonValue,
      mediaUrl: message.mediaUrl,
      mimeType: message.mimeType,
      fileName: message.fileName,
      fileSize: message.fileSize,
      storagePath: message.storagePath,
      fromMe: message.fromMe,
      sourceAgent: message.sourceAgent,
      processed: message.processed,
      receivedAt: message.receivedAt,
      createdAt: message.createdAt,
    }
  },
}
