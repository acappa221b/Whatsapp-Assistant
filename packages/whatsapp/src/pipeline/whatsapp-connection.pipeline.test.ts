import { describe, expect, it, vi } from 'vitest'
import { InMemoryEventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import { WhatsappConnectionPipeline } from './whatsapp-connection.pipeline'
import type { WhatsappStatus } from '../index'

describe('WhatsappConnectionPipeline', () => {
  it('publishes connected and disconnected events on status changes', async () => {
    const eventBus = new InMemoryEventBus()
    const publishSpy = vi.spyOn(eventBus, 'publish')

    let statusHandler: ((status: WhatsappStatus) => void) | undefined
    const provider = {
      onStatusChange(handler: (status: WhatsappStatus) => void) {
        statusHandler = handler
        return () => undefined
      },
    }

    new WhatsappConnectionPipeline(eventBus).register(provider)

    statusHandler?.({
      status: 'connected',
      qrCode: null,
      qrCodeDataUrl: null,
      lastConnectedAt: new Date(),
      messageCount: 0,
      authenticated: true,
    })
    statusHandler?.({
      status: 'disconnected',
      qrCode: null,
      qrCodeDataUrl: null,
      lastConnectedAt: null,
      messageCount: 0,
      authenticated: false,
    })

    await vi.waitUntil(() => publishSpy.mock.calls.length >= 2)

    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: DomainEvents.WhatsappConnected }),
    )
    expect(publishSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: DomainEvents.WhatsappDisconnected }),
    )
    expect(publishSpy).toHaveBeenCalledTimes(2)
  })
})
