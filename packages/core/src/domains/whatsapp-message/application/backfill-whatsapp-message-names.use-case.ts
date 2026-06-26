import type { WhatsappMessageRepository } from '../domain/whatsapp-message.repository'

export type BackfillWhatsappMessageNamesInput = {
  chatId?: string
  senderId?: string
  chatName?: string | null
  senderName?: string | null
}

export class BackfillWhatsappMessageNamesUseCase {
  constructor(private readonly repository: WhatsappMessageRepository) {}

  async execute(input: BackfillWhatsappMessageNamesInput): Promise<number> {
    return this.repository.backfillMissingNames(input)
  }
}
