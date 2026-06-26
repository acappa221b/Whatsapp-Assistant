import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { ProcessingResult } from './processing-result'

export type MessageProcessorInput = {
  messageId: string
  externalMessageId: string
  chatId: string
  chatDisplayName?: string | null
  chatStorageDir?: string | null
  messageType: MessageType
  content: string
  mediaUrl?: string | null
  mimeType?: string | null
  fileName?: string | null
  fileSize?: number | null
  storagePath?: string | null
}

export interface MessageProcessor {
  readonly name: string
  canProcess(messageType: MessageType): boolean
  process(input: MessageProcessorInput): Promise<ProcessingResult>
}
