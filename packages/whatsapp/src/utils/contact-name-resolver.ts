import type { RawBaileysMessage } from './baileys-message.util'
import { isGenericDisplayName, isJidLike, logRc07 } from '@finance-ai/shared/utils'
import { ChatContactResolver } from './chat-contact-resolver'

export type BaileysContact = {
  id?: string
  name?: string
  notify?: string
  verifiedName?: string
}

type ContactRecord = {
  name?: string
  notify?: string
  verifiedName?: string
}

export type GroupMetadataFetcher = (jid: string) => Promise<{ subject?: string } | undefined>

export type ContactNameResolverOptions = {
  groupMetadataFetcher?: GroupMetadataFetcher
  metadataTimeoutMs?: number
  onGroupNameResolved?: (chatId: string, name: string) => void | Promise<void>
  chatNameLookup?: (chatId: string) => string | null
  ownJid?: string | null
}

const DEFAULT_METADATA_TIMEOUT_MS = 5_000

export class ContactNameResolver {
  private readonly contacts = new Map<string, ContactRecord>()
  private readonly chatNames = new Map<string, string>()
  private readonly pushNames = new Map<string, string>()
  private readonly pendingGroupMetadata = new Set<string>()
  private groupMetadataFetcher?: GroupMetadataFetcher
  private readonly metadataTimeoutMs: number
  private readonly onGroupNameResolved?: (chatId: string, name: string) => void | Promise<void>
  private readonly chatNameLookup?: (chatId: string) => string | null
  private readonly chatContactResolver: ChatContactResolver

  constructor(options: ContactNameResolverOptions = {}) {
    this.groupMetadataFetcher = options.groupMetadataFetcher
    this.metadataTimeoutMs = options.metadataTimeoutMs ?? DEFAULT_METADATA_TIMEOUT_MS
    this.onGroupNameResolved = options.onGroupNameResolved
    this.chatNameLookup = options.chatNameLookup
    this.chatContactResolver = new ChatContactResolver({
      ownJid: options.ownJid,
      chatNameLookup: options.chatNameLookup,
      getContactName: (jid) => this.resolvePersistableName(jid),
    })
  }

  setOwnJid(jid: string | null | undefined): void {
    this.chatContactResolver.setOwnJid(jid)
  }

  setGroupMetadataFetcher(fetcher: GroupMetadataFetcher): void {
    this.groupMetadataFetcher = fetcher
  }

  upsertContact(contact: BaileysContact): void {
    const jid = contact.id?.trim()
    if (!jid) return
    const existing = this.contacts.get(jid) ?? {}
    this.contacts.set(jid, {
      name: contact.name?.trim() || existing.name,
      notify: contact.notify?.trim() || existing.notify,
      verifiedName: contact.verifiedName?.trim() || existing.verifiedName,
    })
  }

  setChatName(jid: string, name: string | null | undefined): void {
    const trimmed = name?.trim()
    if (!trimmed || isJidLike(trimmed)) return
    this.chatNames.set(jid, trimmed)
  }

  setPushName(jid: string, pushName: string | null | undefined): void {
    const trimmed = pushName?.trim()
    if (!trimmed || isJidLike(trimmed)) return
    this.pushNames.set(jid, trimmed)
  }

  recordMessagePushNames(raw: RawBaileysMessage): void {
    const chatId = raw.key.remoteJid?.trim()
    const participant = raw.key.participant?.trim()
    const pushName = raw.pushName?.trim()
    const fromMe = raw.key.fromMe ?? false
    if (pushName) {
      if (participant) this.setPushName(participant, pushName)
      if (chatId && !chatId.endsWith('@g.us') && !fromMe) {
        this.setPushName(chatId, pushName)
      }
    }
  }

  getBestName(jid: string): string | null {
    const contact = this.contacts.get(jid)
    if (contact?.name?.trim()) return contact.name.trim()
    if (contact?.notify?.trim()) return contact.notify.trim()
    if (contact?.verifiedName?.trim()) return contact.verifiedName.trim()
    const push = this.pushNames.get(jid)
    if (push?.trim()) return push.trim()
    const chat = this.chatNames.get(jid)
    if (chat?.trim()) return chat.trim()
    const fromConfig = this.chatNameLookup?.(jid)
    if (fromConfig?.trim()) return fromConfig.trim()
    return this.matchPushNameByNumericSuffix(jid)
  }

  /** @lid JIDs may differ between contacts.upsert and message participant. */
  private matchPushNameByNumericSuffix(jid: string): string | null {
    const numeric = jid.split('@')[0]?.replace(/\D/g, '')
    if (!numeric || numeric.length < 8) return null
    for (const [key, pushName] of this.pushNames.entries()) {
      const keyNumeric = key.split('@')[0]?.replace(/\D/g, '')
      if (keyNumeric && keyNumeric === numeric && pushName.trim()) {
        return pushName.trim()
      }
    }
    return null
  }

  resolvePersistableName(jid: string): string | null {
    const best = this.getBestName(jid)
    if (!best || isGenericDisplayName(best)) return null
    return best
  }

  resolveForMessage(raw: RawBaileysMessage): { chatName: string | null; senderName: string | null } {
    this.recordMessagePushNames(raw)
    const resolved = this.chatContactResolver.resolveForMessage(raw)
    logRc07('CONTACT', {
      chatId: raw.key.remoteJid,
      fromMe: raw.key.fromMe ?? false,
      chatName: resolved.chatName,
      senderName: resolved.senderName,
    })
    if (!this.chatContactResolver.shouldPersistChatName(raw, resolved.chatName)) {
      return { ...resolved, chatName: null }
    }
    return resolved
  }

  enrichGroupMetadataAsync(chatId: string): void {
    if (!chatId.endsWith('@g.us')) return
    if (this.resolvePersistableName(chatId)) return
    if (!this.groupMetadataFetcher) return
    if (this.pendingGroupMetadata.has(chatId)) return

    this.pendingGroupMetadata.add(chatId)
    void this.fetchGroupMetadata(chatId).finally(() => {
      this.pendingGroupMetadata.delete(chatId)
    })
  }

  /** RC-09 — await group subject with configurable timeout (default 10s). */
  async fetchGroupMetadataSync(
    chatId: string,
    timeoutMs = 10_000,
  ): Promise<{ name: string | null; source: string }> {
    if (!chatId.endsWith('@g.us')) {
      return { name: null, source: 'not-group' }
    }

    const cached = this.resolvePersistableName(chatId)
    if (cached) return { name: cached, source: 'cache' }

    const fetcher = this.groupMetadataFetcher
    if (!fetcher) return { name: null, source: 'no-fetcher' }

    try {
      const result = await Promise.race([
        fetcher(chatId),
        new Promise<undefined>((_, reject) =>
          setTimeout(() => reject(new Error('groupMetadata timeout')), timeoutMs),
        ),
      ])
      const subject = result?.subject?.trim()
      if (subject && !isJidLike(subject)) {
        this.setChatName(chatId, subject)
        await this.onGroupNameResolved?.(chatId, subject)
        return { name: subject, source: 'groupMetadata' }
      }
      return { name: null, source: 'groupMetadata-empty' }
    } catch (error) {
      console.warn('[RC-09/groupMetadata] failed', {
        chatId,
        error: error instanceof Error ? error.message : String(error),
      })
      return { name: null, source: 'groupMetadata-failed' }
    }
  }

  resolveContactName(chatId: string): { name: string | null; source: string } {
    const cached = this.resolvePersistableName(chatId)
    if (cached) return { name: cached, source: 'contact-cache' }
    return { name: null, source: 'contact-missing' }
  }

  private async fetchGroupMetadata(chatId: string): Promise<void> {
    const fetcher = this.groupMetadataFetcher
    if (!fetcher) return

    try {
      const result = await Promise.race([
        fetcher(chatId),
        new Promise<undefined>((_, reject) =>
          setTimeout(() => reject(new Error('groupMetadata timeout')), this.metadataTimeoutMs),
        ),
      ])
      const subject = result?.subject?.trim()
      if (subject && !isJidLike(subject)) {
        this.setChatName(chatId, subject)
        await this.onGroupNameResolved?.(chatId, subject)
      }
    } catch (error) {
      console.warn('[RC-07/groupMetadata] failed', {
        chatId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
