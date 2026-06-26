import { ValidationError } from '@finance-ai/shared/errors'
import { MessageType, MessageTypeVO } from '../../../domain/value-objects/whatsapp-enums'

export type WhatsappMessageProps = {
  id: string
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
  sourceAgent: boolean
  processed: boolean
  receivedAt: Date
  createdAt: Date
}

export class WhatsappMessage {
  readonly id: string
  readonly externalMessageId: string
  readonly chatId: string
  readonly chatName: string | null
  readonly sender: string
  readonly senderId: string
  readonly senderName: string | null
  readonly content: string
  readonly messageType: MessageType
  readonly rawPayload: Record<string, unknown>
  readonly mediaUrl: string | null
  readonly mimeType: string | null
  readonly fileName: string | null
  readonly fileSize: number | null
  readonly storagePath: string | null
  readonly fromMe: boolean
  readonly sourceAgent: boolean
  readonly processed: boolean
  readonly receivedAt: Date
  readonly createdAt: Date

  private constructor(props: WhatsappMessageProps) {
    this.id = props.id
    this.externalMessageId = props.externalMessageId
    this.chatId = props.chatId
    this.chatName = props.chatName
    this.sender = props.sender
    this.senderId = props.senderId
    this.senderName = props.senderName
    this.content = props.content
    this.messageType = props.messageType
    this.rawPayload = props.rawPayload
    this.mediaUrl = props.mediaUrl
    this.mimeType = props.mimeType
    this.fileName = props.fileName
    this.fileSize = props.fileSize
    this.storagePath = props.storagePath
    this.fromMe = props.fromMe
    this.sourceAgent = props.sourceAgent
    this.processed = props.processed
    this.receivedAt = props.receivedAt
    this.createdAt = props.createdAt
  }

  static create(input: {
    id: string
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
    sourceAgent?: boolean
    receivedAt: Date
    now?: Date
  }): WhatsappMessage {
    const externalMessageId = WhatsappMessage.validateExternalMessageId(input.externalMessageId)
    const chatId = WhatsappMessage.validateRequired(input.chatId, 'Chat ID')
    const senderId = WhatsappMessage.validateRequired(input.senderId, 'Sender ID')
    const sender = WhatsappMessage.validateRequired(input.sender, 'Sender')
    MessageTypeVO.create(input.messageType)
    const content = WhatsappMessage.validateContent(input.content, input.messageType)
    const now = input.now ?? new Date()
    return new WhatsappMessage({
      id: input.id,
      externalMessageId,
      chatId,
      chatName: WhatsappMessage.validateOptionalTrimmed(input.chatName),
      sender,
      senderId,
      senderName: WhatsappMessage.validateOptionalTrimmed(input.senderName),
      content,
      messageType: input.messageType,
      rawPayload: input.rawPayload,
      mediaUrl: input.mediaUrl ?? null,
      mimeType: WhatsappMessage.validateOptionalTrimmed(input.mimeType),
      fileName: WhatsappMessage.validateOptionalTrimmed(input.fileName),
      fileSize: WhatsappMessage.validateOptionalFileSize(input.fileSize),
      storagePath: WhatsappMessage.validateOptionalTrimmed(input.storagePath),
      fromMe: input.fromMe ?? false,
      sourceAgent: input.sourceAgent ?? false,
      processed: false,
      receivedAt: input.receivedAt,
      createdAt: now,
    })
  }

  static reconstitute(props: WhatsappMessageProps): WhatsappMessage {
    return new WhatsappMessage(props)
  }

  markSourceAgent(): WhatsappMessage {
    return new WhatsappMessage({ ...this, sourceAgent: true })
  }

  markProcessed(): WhatsappMessage {
    if (this.processed) {
      throw new ValidationError('Message is already processed')
    }
    return new WhatsappMessage({ ...this, processed: true })
  }

  withStoredMedia(input: {
    mediaUrl?: string | null
    mimeType?: string | null
    fileName?: string | null
    fileSize?: number | null
    storagePath?: string | null
  }): WhatsappMessage {
    return new WhatsappMessage({
      ...this,
      mediaUrl: input.mediaUrl ?? this.mediaUrl,
      mimeType: WhatsappMessage.validateOptionalTrimmed(input.mimeType) ?? this.mimeType,
      fileName: WhatsappMessage.validateOptionalTrimmed(input.fileName) ?? this.fileName,
      fileSize: WhatsappMessage.validateOptionalFileSize(input.fileSize) ?? this.fileSize,
      storagePath: WhatsappMessage.validateOptionalTrimmed(input.storagePath) ?? this.storagePath,
    })
  }

  enrichFrom(input: {
    content?: string
    messageType?: MessageType
    senderName?: string | null
    chatName?: string | null
    rawPayload?: Record<string, unknown>
  }): WhatsappMessage {
    const content = input.content?.trim() ? input.content.trim() : this.content
    const messageType = input.messageType ?? this.messageType
    return new WhatsappMessage({
      ...this,
      content: WhatsappMessage.validateContent(content, messageType),
      messageType,
      senderName: WhatsappMessage.validateOptionalTrimmed(input.senderName) ?? this.senderName,
      chatName: WhatsappMessage.validateOptionalTrimmed(input.chatName) ?? this.chatName,
      rawPayload: input.rawPayload ?? this.rawPayload,
      sender: WhatsappMessage.validateOptionalTrimmed(input.senderName) ?? this.senderName ?? this.sender,
    })
  }

  static validateExternalMessageId(value: string): string {
    const trimmed = value.trim()
    if (trimmed.length < 1) {
      throw new ValidationError('External message ID is required')
    }
    return trimmed
  }

  static validateContent(content: string, messageType: MessageType): string {
    const trimmed = content.trim()
    if (messageType === 'TEXT' && trimmed.length === 0) {
      throw new ValidationError('TEXT messages must have non-empty content')
    }
    return trimmed
  }

  private static validateOptionalTrimmed(value: string | null | undefined): string | null {
    if (value === undefined || value === null) return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  private static validateOptionalFileSize(value: number | null | undefined): number | null {
    if (value === undefined || value === null) return null
    if (!Number.isInteger(value) || value < 0) {
      throw new ValidationError('File size must be a non-negative integer')
    }
    return value
  }

  private static validateRequired(value: string, label: string): string {
    const trimmed = value.trim()
    if (trimmed.length < 1) {
      throw new ValidationError(`${label} is required`)
    }
    return trimmed
  }
}
