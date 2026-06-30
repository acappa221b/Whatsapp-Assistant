import { describe, expect, it, vi } from 'vitest'
import { InMemoryEventBus, DomainEvents } from '@finance-ai/core/events'
import { TranscribeAudioUseCase } from './transcribe-audio.use-case'
import { WhatsappMessage } from '../../whatsapp-message/domain/whatsapp-message.entity'

function buildAudioMessage(overrides: Partial<Parameters<typeof WhatsappMessage.create>[0]> = {}) {
  return WhatsappMessage.create({
    id: 'msg-1',
    externalMessageId: 'ext-1',
    chatId: '5511999999999@s.whatsapp.net',
    sender: 'Contato',
    senderId: '5511999999999@s.whatsapp.net',
    content: '[audio]',
    messageType: 'AUDIO',
    rawPayload: { message: { audioMessage: { mimetype: 'audio/ogg' } } },
    receivedAt: new Date(),
    ...overrides,
  })
}

describe('TranscribeAudioUseCase', () => {
  it('updates content and publishes TranscriptionCompleted on success', async () => {
    const eventBus = new InMemoryEventBus()
    const events: string[] = []
    eventBus.subscribe(DomainEvents.TranscriptionCompleted, () => {
      events.push('completed')
    })

    const message = buildAudioMessage()
    const messageRepository = {
      findById: vi.fn().mockResolvedValue(message),
      updateContent: vi.fn().mockResolvedValue(message),
      updateStoragePath: vi.fn().mockResolvedValue(message),
    }
    const chatConfigRepository = {
      findByChatId: vi.fn().mockResolvedValue({
        archiveEnabled: true,
        audioProcessingEnabled: true,
        name: 'Chat',
        storageDir: null,
      }),
    }

    const useCase = new TranscribeAudioUseCase(
      chatConfigRepository as never,
      messageRepository as never,
      {
        downloadAudio: vi.fn().mockResolvedValue({
          absolutePath: '/tmp/audio.ogg',
          storagePath: 'chat/audio.ogg',
        }),
      },
      {
        transcribeAudio: vi.fn().mockResolvedValue({
          text: 'ola mundo',
          tokensInput: 0,
          tokensOutput: 0,
          model: 'whisper-1',
        }),
      },
      { execute: vi.fn().mockResolvedValue(undefined) } as never,
      eventBus,
    )

    await useCase.execute('msg-1')

    expect(messageRepository.updateContent).toHaveBeenCalledWith('msg-1', '[ÁUDIO] ola mundo')
    expect(events).toContain('completed')
  })

  it('writes failed content and publishes TranscriptionFailed on error', async () => {
    const eventBus = new InMemoryEventBus()
    const events: string[] = []
    eventBus.subscribe(DomainEvents.TranscriptionFailed, () => {
      events.push('failed')
    })

    const message = buildAudioMessage()
    const messageRepository = {
      findById: vi.fn().mockResolvedValue(message),
      updateContent: vi.fn().mockResolvedValue(message),
      updateStoragePath: vi.fn().mockResolvedValue(message),
    }

    const useCase = new TranscribeAudioUseCase(
      {
        findByChatId: vi.fn().mockResolvedValue({
          archiveEnabled: true,
          audioProcessingEnabled: true,
          name: 'Chat',
          storageDir: null,
        }),
      } as never,
      messageRepository as never,
      {
        downloadAudio: vi.fn().mockResolvedValue({
          absolutePath: '/tmp/audio.ogg',
          storagePath: 'chat/audio.ogg',
        }),
      },
      {
        transcribeAudio: vi.fn().mockRejectedValue(new Error('Gemini transcription not configured')),
      },
      { execute: vi.fn() } as never,
      eventBus,
    )

    await useCase.execute('msg-1')

    const failedContent = (messageRepository.updateContent as ReturnType<typeof vi.fn>).mock.calls[0]?.[1]
    expect(String(failedContent)).toContain('[ÁUDIO_ERRO]')
    expect(String(failedContent)).not.toContain('sk-')
    expect(events).toContain('failed')
  })
})
