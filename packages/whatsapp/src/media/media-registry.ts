import type { RawBaileysMessage } from '../utils/baileys-message.util'

export class InMemoryWhatsappMediaRegistry {
  private readonly messages = new Map<string, RawBaileysMessage>()

  register(message: RawBaileysMessage): void {
    const externalMessageId = message.key.id?.trim()
    if (!externalMessageId) return
    this.messages.set(externalMessageId, message)
  }

  get(externalMessageId: string): RawBaileysMessage | undefined {
    return this.messages.get(externalMessageId)
  }
}

export const whatsappMediaRegistry = new InMemoryWhatsappMediaRegistry()
