import { describe, expect, it } from 'vitest'
import { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import {
  EnsureWhatsappChatDiscoveredUseCase,
  UpdateWhatsappChatConfigUseCase,
} from '../application/whatsapp-chat-config.use-cases'
import { InMemoryWhatsappChatConfigRepository } from '../infrastructure/in-memory-whatsapp-chat-config.repository'

describe('WhatsappChatConfig archive governance (RC-11 permissions v2)', () => {
  it('creates with archiveEnabled false by default', () => {
    const config = WhatsappChatConfig.create({ chatId: '120363421372276062@g.us' })
    expect(config.archiveEnabled).toBe(false)
    expect(config.agentChatEnabled).toBe(false)
    expect(config.photoProcessingEnabled).toBe(false)
    expect(config.audioProcessingEnabled).toBe(false)
    expect(config.reportGenerationEnabled).toBe(false)
  })

  it('cascades archive off to all feature flags', () => {
    const config = WhatsappChatConfig.create({
      chatId: '120363421372276062@g.us',
      archiveEnabled: true,
      agentChatEnabled: true,
      photoProcessingEnabled: true,
      audioProcessingEnabled: true,
      reportGenerationEnabled: true,
    })
    const updated = config.update({ archiveEnabled: false })
    expect(updated.archiveEnabled).toBe(false)
    expect(updated.agentChatEnabled).toBe(false)
    expect(updated.photoProcessingEnabled).toBe(false)
    expect(updated.audioProcessingEnabled).toBe(false)
    expect(updated.reportGenerationEnabled).toBe(false)
  })

  it('allows agent without deprecated aiProcessing flag', () => {
    const config = WhatsappChatConfig.create({
      chatId: '120363421372276062@g.us',
      archiveEnabled: true,
    })
    const updated = config.update({ agentChatEnabled: true })
    expect(updated.agentChatEnabled).toBe(true)
    expect(updated.archiveEnabled).toBe(true)
  })

  it('features are independent when archive is on', () => {
    const config = WhatsappChatConfig.create({
      chatId: '120363421372276062@g.us',
      archiveEnabled: true,
      agentChatEnabled: true,
    })
    const updated = config.update({ photoProcessingEnabled: true, reportGenerationEnabled: false })
    expect(updated.agentChatEnabled).toBe(true)
    expect(updated.photoProcessingEnabled).toBe(true)
    expect(updated.reportGenerationEnabled).toBe(false)
  })

  it('EnsureWhatsappChatDiscovered creates with archiveEnabled false', async () => {
    const repository = new InMemoryWhatsappChatConfigRepository()
    const useCase = new EnsureWhatsappChatDiscoveredUseCase(repository)
    const created = await useCase.execute('5511999999999@s.whatsapp.net', 'Contato')
    expect(created.archiveEnabled).toBe(false)
  })

  it('UpdateWhatsappChatConfig enables agent when archive is on', async () => {
    const repository = new InMemoryWhatsappChatConfigRepository()
    await repository.save(
      WhatsappChatConfig.create({
        chatId: '120363421372276062@g.us',
        archiveEnabled: true,
      }),
    )
    const updated = await new UpdateWhatsappChatConfigUseCase(repository).execute(
      '120363421372276062@g.us',
      { agentChatEnabled: true },
    )
    expect(updated.agentChatEnabled).toBe(true)
  })

  it('UpdateWhatsappChatConfig turning archive off disables features', async () => {
    const repository = new InMemoryWhatsappChatConfigRepository()
    await repository.save(
      WhatsappChatConfig.create({
        chatId: '120363421372276062@g.us',
        archiveEnabled: true,
        agentChatEnabled: true,
        photoProcessingEnabled: true,
      }),
    )
    const updated = await new UpdateWhatsappChatConfigUseCase(repository).execute(
      '120363421372276062@g.us',
      { archiveEnabled: false },
    )
    expect(updated.archiveEnabled).toBe(false)
    expect(updated.agentChatEnabled).toBe(false)
    expect(updated.photoProcessingEnabled).toBe(false)
  })
})
