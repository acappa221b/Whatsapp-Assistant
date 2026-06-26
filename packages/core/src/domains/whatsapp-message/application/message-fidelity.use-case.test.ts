import { describe, expect, it } from 'vitest'
import { GetMessageFidelityMetricsUseCase } from './message-fidelity.use-case'
import { InMemoryWhatsappMessageRepository } from '../infrastructure/in-memory-whatsapp-message.repository'
import { WhatsappMessage } from '../domain/whatsapp-message.entity'

describe('GetMessageFidelityMetricsUseCase (RC-06F)', () => {
  it('computes rates from in-memory repository', async () => {
    const repo = new InMemoryWhatsappMessageRepository()
    const useCase = new GetMessageFidelityMetricsUseCase(repo)
    const now = new Date()

    await repo.save(
      WhatsappMessage.create({
        id: '1',
        externalMessageId: 'ext-1',
        chatId: '5511@s.whatsapp.net',
        chatName: 'Maria',
        senderId: '5511@s.whatsapp.net',
        sender: 'Maria',
        senderName: 'Maria',
        messageType: 'TEXT',
        content: 'Olá',
        rawPayload: {},
        fromMe: false,
        receivedAt: now,
      }),
    )
    await repo.save(
      WhatsappMessage.reconstitute({
        id: '2',
        externalMessageId: 'ext-2',
        chatId: '5511@s.whatsapp.net',
        chatName: 'Maria',
        senderId: '5511@s.whatsapp.net',
        sender: 'Maria',
        senderName: 'Maria',
        messageType: 'TEXT',
        content: '',
        rawPayload: {},
        mediaUrl: null,
        mimeType: null,
        fileName: null,
        fileSize: null,
        storagePath: null,
        fromMe: false,
        processed: false,
        receivedAt: now,
        createdAt: now,
      }),
    )

    const metrics = await useCase.execute()
    expect(metrics.totalMessages).toBe(2)
    expect(metrics.extractedTexts).toBe(1)
    expect(metrics.textEmpty).toBe(1)
    expect(metrics.textExtractionRate).toBe(0.5)
  })
})
