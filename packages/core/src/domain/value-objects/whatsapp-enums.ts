import { ValidationError } from '@finance-ai/shared/errors'

export const MESSAGE_TYPES = [
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
] as const
export type MessageType = (typeof MESSAGE_TYPES)[number]

export class MessageTypeVO {
  readonly value: MessageType

  private constructor(value: MessageType) {
    this.value = value
  }

  static create(value: string): MessageTypeVO {
    if (!MESSAGE_TYPES.includes(value as MessageType)) {
      throw new ValidationError(`Invalid message type: ${value}`)
    }
    return new MessageTypeVO(value as MessageType)
  }
}

export const WHATSAPP_CONNECTION_STATUSES = [
  'disconnected',
  'connecting',
  'qr',
  'connected',
] as const
export type WhatsappConnectionStatus = (typeof WHATSAPP_CONNECTION_STATUSES)[number]
