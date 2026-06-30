import { describe, expect, it } from 'vitest'
import { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import { InMemoryWhatsappChatConfigRepository } from '../infrastructure/in-memory-whatsapp-chat-config.repository'
import { PruneOrphanChatConfigsUseCase } from '../application/prune-orphan-chat-configs.use-case'

describe('PruneOrphanChatConfigsUseCase', () => {
  it('dry-run lists orphan configs without messages', async () => {
    const repo = new InMemoryWhatsappChatConfigRepository()
    repo.setMessageChatIds(['5511@s.whatsapp.net'])
    await repo.save(
      WhatsappChatConfig.create({
        chatId: '5511@s.whatsapp.net',
        name: 'Ana',
        archiveEnabled: false,
        agentChatEnabled: false,
        photoProcessingEnabled: false,
        audioProcessingEnabled: false,
        reportGenerationEnabled: false,
      }),
    )
    await repo.save(
      WhatsappChatConfig.create({
        chatId: '120363@g.us',
        name: 'Grupo',
        archiveEnabled: false,
        agentChatEnabled: false,
        photoProcessingEnabled: false,
        audioProcessingEnabled: false,
        reportGenerationEnabled: false,
      }),
    )

    const useCase = new PruneOrphanChatConfigsUseCase(repo)
    const preview = await useCase.execute({ includeGroups: true, dryRun: true })
    expect(preview.total).toBe(1)
    expect(preview.groupCount).toBe(1)
    expect(preview.chatIds).toEqual(['120363@g.us'])

    const removed = await useCase.execute({ includeGroups: true, dryRun: false })
    expect(removed.removed).toBe(1)
    expect(await repo.findByChatId('120363@g.us')).toBeNull()
    expect(await repo.findByChatId('5511@s.whatsapp.net')).not.toBeNull()
  })
})
