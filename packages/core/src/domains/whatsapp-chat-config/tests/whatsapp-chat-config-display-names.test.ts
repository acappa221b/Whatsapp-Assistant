import { describe, expect, it } from 'vitest'
import { EnsureWhatsappChatDiscoveredUseCase } from '../application/whatsapp-chat-config.use-cases'
import { InMemoryWhatsappChatConfigRepository } from '../infrastructure/in-memory-whatsapp-chat-config.repository'

describe('EnsureWhatsappChatDiscoveredUseCase (RC-06)', () => {
  it('upgrades generic name when better name arrives', async () => {
    const repo = new InMemoryWhatsappChatConfigRepository()
    const useCase = new EnsureWhatsappChatDiscoveredUseCase(repo)

    await useCase.execute('group@g.us', 'Grupo')
    const updated = await useCase.execute('group@g.us', 'Financeiro UNIQUE')

    expect(updated.name).toBe('Financeiro UNIQUE')
  })

  it('does not downgrade real name to generic', async () => {
    const repo = new InMemoryWhatsappChatConfigRepository()
    const useCase = new EnsureWhatsappChatDiscoveredUseCase(repo)

    await useCase.execute('5511@s.whatsapp.net', 'Maria')
    const same = await useCase.execute('5511@s.whatsapp.net', 'Contato')

    expect(same.name).toBe('Maria')
  })
})
