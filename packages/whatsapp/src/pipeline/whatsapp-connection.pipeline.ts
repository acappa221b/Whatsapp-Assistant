import type { EventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import type { WhatsappConnectionStatus } from '@finance-ai/core/domain/value-objects/whatsapp-enums'
import type { WhatsappStatus } from '../index'

export class WhatsappConnectionPipeline {
  constructor(private readonly eventBus: EventBus) {}

  register(provider: {
    onStatusChange(handler: (status: WhatsappStatus) => void): () => void
  }): () => void {
    let previousStatus: WhatsappConnectionStatus | null = null
    return provider.onStatusChange((status) => {
      if (status.status === 'connected' && previousStatus !== 'connected') {
        void this.eventBus.publish({
          name: DomainEvents.WhatsappConnected,
          payload: { connectedAt: status.lastConnectedAt ?? new Date() },
          occurredAt: new Date(),
        })
      }
      if (status.status === 'disconnected' && previousStatus !== 'disconnected' && previousStatus !== null) {
        void this.eventBus.publish({
          name: DomainEvents.WhatsappDisconnected,
          payload: { disconnectedAt: new Date() },
          occurredAt: new Date(),
        })
      }
      previousStatus = status.status
    })
  }
}
