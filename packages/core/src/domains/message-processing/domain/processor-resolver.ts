import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { MessageProcessor } from './message-processor'

export interface ProcessorResolver {
  resolve(messageType: MessageType): MessageProcessor
}
