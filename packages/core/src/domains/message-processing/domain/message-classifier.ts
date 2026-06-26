import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'

export interface MessageClassifier {
  classify(messageType: MessageType): MessageType
}
