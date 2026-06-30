import type { BaileysContact } from './contact-name-resolver'
import { ContactNameResolver } from './contact-name-resolver'
import { logRc02BaileysEvent } from './rc-02-diagnostic'

type NamedChat = {
  id?: string
  name?: string
  subject?: string
}

function persistContact(
  source: string,
  contacts: BaileysContact[],
  resolver: ContactNameResolver,
  onContactDiscovered?: (jid: string, name: string) => void | Promise<void>,
  syncAddressBookEnabled = false,
): void {
  for (const contact of contacts) {
    const jid = contact.id?.trim()
    if (!jid) continue
    resolver.upsertContact(contact)
    const name = resolver.getBestName(jid)
    logRc02BaileysEvent({
      event: source,
      count: 1,
      items: [{ chatId: jid, chatType: 'contact', name: name ?? null }],
    })
    if (syncAddressBookEnabled && name && onContactDiscovered) {
      void onContactDiscovered(jid, name)
    }
  }
}

/** Escuta contacts.upsert / contacts.update e alimenta ContactNameResolver. */
export function attachContactDiscoveryListeners(
  socket: {
    ev: { on(event: string, listener: (...args: unknown[]) => void): void }
  },
  options: {
    resolver: ContactNameResolver
    onContactDiscovered?: (jid: string, name: string) => void | Promise<void>
    syncAddressBookEnabled?: boolean
  },
): void {
  const { resolver, onContactDiscovered, syncAddressBookEnabled = false } = options

  socket.ev.on('contacts.upsert', (payload: unknown) => {
    if (!Array.isArray(payload)) return
    persistContact(
      'contacts.upsert',
      payload as BaileysContact[],
      resolver,
      onContactDiscovered,
      syncAddressBookEnabled,
    )
  })

  socket.ev.on('contacts.update', (payload: unknown) => {
    if (!Array.isArray(payload)) return
    persistContact(
      'contacts.update',
      payload as BaileysContact[],
      resolver,
      onContactDiscovered,
      syncAddressBookEnabled,
    )
  })
}

/** Atualiza group-discovery para também alimentar resolver. */
export function feedNamedChatToResolver(
  resolver: ContactNameResolver,
  chat: NamedChat,
): string | null {
  const chatId = chat.id?.trim()
  if (!chatId) return null
  const name = chat.subject ?? chat.name ?? null
  if (name) resolver.setChatName(chatId, name)
  return name
}
