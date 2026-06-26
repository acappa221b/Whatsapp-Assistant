import { NotFoundError } from '../../../domain/errors'
import { isMoreInformativeName } from '@finance-ai/shared/utils'
import { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import type { WhatsappChatConfigRepository } from '../domain/whatsapp-chat-config.repository'

export class EnsureWhatsappChatDiscoveredUseCase {
  constructor(private readonly repository: WhatsappChatConfigRepository) {}

  async execute(chatId: string, name?: string | null): Promise<WhatsappChatConfig> {
    const trimmed = chatId.trim()
    const existing = await this.repository.findByChatId(trimmed)
    if (existing) {
      if (name?.trim() && isMoreInformativeName(name, existing.name)) {
        return this.repository.save(existing.withName(name))
      }
      return existing
    }

    return this.repository.save(
      WhatsappChatConfig.create({
        chatId: trimmed,
        name: name?.trim() || null,
        archiveEnabled: false,
        agentChatEnabled: false,
        photoProcessingEnabled: false,
        audioProcessingEnabled: false,
        reportGenerationEnabled: false,
      }),
    )
  }
}

export class ListWhatsappChatConfigsUseCase {
  constructor(private readonly repository: WhatsappChatConfigRepository) {}

  async execute(): Promise<WhatsappChatConfig[]> {
    return this.repository.findAll()
  }
}

export type UpdateWhatsappChatConfigInput = {
  name?: string | null
  archiveEnabled?: boolean
  agentChatEnabled?: boolean
  photoProcessingEnabled?: boolean
  audioProcessingEnabled?: boolean
  reportGenerationEnabled?: boolean
}

export class UpdateWhatsappChatConfigUseCase {
  constructor(private readonly repository: WhatsappChatConfigRepository) {}

  async execute(chatId: string, input: UpdateWhatsappChatConfigInput): Promise<WhatsappChatConfig> {
    const existing = await this.repository.findByChatId(chatId.trim())
    if (!existing) throw new NotFoundError('WhatsappChatConfig', chatId)
    return this.repository.save(existing.update(input))
  }
}
