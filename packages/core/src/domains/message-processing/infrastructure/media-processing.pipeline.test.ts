import { describe, expect, it, vi } from 'vitest'
import { InMemoryEventBus, DomainEvents } from '@finance-ai/core/events'
import { MediaProcessingPipeline } from './media-processing.pipeline'

describe('MediaProcessingPipeline', () => {
  it('does not await audio processing (fire-and-forget)', async () => {
    const eventBus = new InMemoryEventBus()
    let audioDone = false

    const onAudioProcessing = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40))
      audioDone = true
    })

    const pipeline = new MediaProcessingPipeline(
      eventBus,
      {
        findByChatId: vi.fn().mockResolvedValue({
          archiveEnabled: true,
          audioProcessingEnabled: true,
          photoProcessingEnabled: false,
        }),
      } as never,
      {
        findById: vi.fn().mockResolvedValue({
          messageType: 'AUDIO',
        }),
      } as never,
      vi.fn(),
      onAudioProcessing,
    )

    pipeline.register()

    await eventBus.publish({
      name: DomainEvents.WhatsappMessagePersisted,
      payload: {
        messageId: 'msg-audio',
        chatId: '5511999999999@s.whatsapp.net',
        messageType: 'AUDIO',
        fromMe: false,
      },
      occurredAt: new Date(),
    })

    expect(onAudioProcessing).toHaveBeenCalled()
    expect(audioDone).toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 60))
    expect(audioDone).toBe(true)
  })
})
