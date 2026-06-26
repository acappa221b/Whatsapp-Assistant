import { NotFoundError } from '../../../domain/errors'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'

export class HandleHumanTakeoverUseCase {
  constructor(private readonly repository: WhatsappChatConfigRepository) {}

  async execute(chatId: string): Promise<void> {
    const existing = await this.repository.findByChatId(chatId.trim())
    if (!existing) return
    if (!existing.agentChatEnabled && existing.agentPausedReason === 'human_takeover') return
    await this.repository.save(existing.applyHumanTakeover())
  }
}

export class PauseAgentAfterDeferralUseCase {
  constructor(private readonly repository: WhatsappChatConfigRepository) {}

  async execute(chatId: string): Promise<void> {
    const existing = await this.repository.findByChatId(chatId.trim())
    if (!existing) throw new NotFoundError('WhatsappChatConfig', chatId)
    await this.repository.save(existing.applyDeferralPause())
  }
}
