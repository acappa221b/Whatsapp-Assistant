import type { RawBaileysMessage } from './baileys-message.util'
import { isGenericDisplayName, isJidLike } from '@finance-ai/shared/utils'

export type ChatContactResolverOptions = {
  ownJid?: string | null
  chatNameLookup?: (chatId: string) => string | null
  getContactName?: (jid: string) => string | null
}

function normalizeJid(jid: string): string {
  return jid.trim().split(':')[0] ?? jid.trim()
}

function isOwnJid(chatId: string, ownJid: string | null | undefined): boolean {
  if (!ownJid?.trim()) return false
  return normalizeJid(chatId) === normalizeJid(ownJid)
}

/**
 * Resolves display names for chats and senders with DM/group/self rules.
 * Never uses outbound pushName as DM chat title (except self-chat).
 */
export class ChatContactResolver {
  private ownJid: string | null
  private readonly chatNameLookup?: (chatId: string) => string | null
  private readonly getContactName?: (jid: string) => string | null

  constructor(options: ChatContactResolverOptions = {}) {
    this.ownJid = options.ownJid?.trim() || null
    this.chatNameLookup = options.chatNameLookup
    this.getContactName = options.getContactName
  }

  setOwnJid(jid: string | null | undefined): void {
    this.ownJid = jid?.trim() || null
  }

  resolveForMessage(raw: RawBaileysMessage): {
    chatName: string | null
    senderName: string | null
  } {
    const chatId = raw.key.remoteJid?.trim() || 'unknown@unknown'
    const fromMe = raw.key.fromMe ?? false
    const participant = raw.key.participant?.trim()
    const senderJid = participant || chatId
    const pushName = raw.pushName?.trim()
    const isGroup = chatId.endsWith('@g.us')

    if (isGroup) {
      const chatName =
        this.getContactName?.(chatId) ??
        this.chatNameLookup?.(chatId) ??
        null
      const senderName =
        this.getContactName?.(senderJid) ??
        (pushName && !isJidLike(pushName) && !fromMe ? pushName : null)
      return { chatName, senderName }
    }

    const contactForChat = this.getContactName?.(chatId) ?? this.chatNameLookup?.(chatId) ?? null

    if (isOwnJid(chatId, this.ownJid)) {
      const selfName =
        contactForChat ??
        (pushName && !isJidLike(pushName) ? pushName : null)
      return { chatName: selfName, senderName: selfName }
    }

    if (fromMe) {
      const chatName = contactForChat
      const senderName =
        this.getContactName?.(this.ownJid ?? '') ??
        (pushName && !isJidLike(pushName) ? pushName : null)
      return { chatName, senderName }
    }

    const theirName =
      contactForChat ??
      (pushName && !isJidLike(pushName) ? pushName : null)

    return { chatName: theirName, senderName: theirName }
  }

  shouldPersistChatName(raw: RawBaileysMessage, chatName: string | null): boolean {
    if (!chatName?.trim() || isGenericDisplayName(chatName)) return false
    const chatId = raw.key.remoteJid?.trim() || ''
    if (chatId.endsWith('@g.us')) return true
    if (raw.key.fromMe && !isOwnJid(chatId, this.ownJid)) return false
    return true
  }
}
