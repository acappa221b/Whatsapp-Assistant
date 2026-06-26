import { fallbackChatDisplayName, isGenericDisplayName, isJidLike } from './display-name'

export type ChatIdentityInput = {
  chatId: string
  chatName?: string | null
  /** Latest inbound peer name when available (list summaries). */
  peerName?: string | null
  configName?: string | null
}

export type SenderIdentityInput = {
  senderName?: string | null
  senderId?: string
}

function normalizeJid(jid: string): string {
  return jid.trim().split(':')[0] ?? jid.trim()
}

/**
 * RC-07 — centralized chat/sender display identity.
 * DM: always the other party. Group: subject. Self-chat: own name only.
 */
export class ChatIdentityResolver {
  constructor(
    private readonly ownJid?: string | null,
    private readonly ownDisplayName?: string | null,
  ) {}

  isSelfChat(chatId: string): boolean {
    if (!this.ownJid?.trim()) return false
    return normalizeJid(chatId) === normalizeJid(this.ownJid)
  }

  isGroup(chatId: string): boolean {
    return chatId.endsWith('@g.us')
  }

  /** Reject stored name if it matches own display name on a non-self DM. */
  private isPollutedOwnName(name: string, chatId: string): boolean {
    if (this.isSelfChat(chatId) || this.isGroup(chatId)) return false
    const ownName = this.ownDisplayName?.trim()
    if (!ownName) return false
    return name.trim().toLowerCase() === ownName.toLowerCase()
  }

  resolveChatName(input: ChatIdentityInput): string {
    const { chatId } = input
    const candidates = [input.configName, input.peerName, input.chatName]
      .map((v) => v?.trim())
      .filter((v): v is string => Boolean(v && !isGenericDisplayName(v)))

    for (const name of candidates) {
      if (this.isPollutedOwnName(name, chatId)) continue
      return name
    }

    return fallbackChatDisplayName(chatId)
  }

  resolveSenderName(input: SenderIdentityInput): string {
    const trimmed = input.senderName?.trim()
    if (trimmed && !isGenericDisplayName(trimmed) && !isJidLike(trimmed)) return trimmed
    return 'Contato'
  }
}
