import type { MessageType } from '../../../domain/value-objects/whatsapp-enums'
import type { MessageProcessor } from '../domain/message-processor'
import type { ProcessorResolver } from '../domain/processor-resolver'
import { UnknownMessageProcessor } from './processors/stub-processors'

export class DefaultProcessorResolver implements ProcessorResolver {
  private readonly processors: MessageProcessor[]
  private readonly fallback: UnknownMessageProcessor

  constructor(processors: MessageProcessor[], fallback: UnknownMessageProcessor = new UnknownMessageProcessor()) {
    this.processors = processors
    this.fallback = fallback
  }

  resolve(messageType: MessageType): MessageProcessor {
    const match = this.processors.find(
      (processor) => processor !== this.fallback && processor.canProcess(messageType),
    )
    return match ?? this.fallback
  }
}
