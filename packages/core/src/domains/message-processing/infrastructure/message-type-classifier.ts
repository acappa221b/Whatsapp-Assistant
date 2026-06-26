import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { MessageClassifier } from '../domain/message-classifier'

export class MessageTypeClassifier implements MessageClassifier {
  classify(messageType: MessageType): MessageType {
    return messageType
  }
}
