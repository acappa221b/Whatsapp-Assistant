import type { RawBaileysMessage } from './baileys-message.util'
import { logRc02BaileysEvent } from './rc-02-diagnostic'
import type { ContactNameResolver } from './contact-name-resolver'
import { feedNamedChatToResolver } from './contact-discovery'
import type { WhatsappDiscoveryPolicy } from '@finance-ai/shared'

const GROUP_DISCOVERY_TARGET = 'Financeiro UNIQUE'

/** Log temporário RC-07.5 — expõe remoteJid (conversa/grupo) vs participant (remetente). */
export function logIncomingMessageDiscovery(raw: RawBaileysMessage): void {
  console.log(
    '[WhatsApp/Group-Discovery] Mensagem recebida de:',
    raw.key.remoteJid,
    'Enviada por:',
    raw.key.participant ?? raw.key.fromMe,
  )
}

type NamedChat = {
  id?: string
  name?: string
  subject?: string
}

function logNamedGroupMatch(source: string, name: string | undefined, id: string | undefined): void {
  if (!name || !id) return
  if (!name.includes(GROUP_DISCOVERY_TARGET)) return
  console.log(`[WhatsApp/Group-Discovery] ${source} — Grupo encontrado:`, name, 'ID:', id)
}

function shouldDiscoverChat(
  chatId: string,
  policy: WhatsappDiscoveryPolicy | undefined,
): boolean {
  if (!policy) return true
  if (chatId.endsWith('@g.us')) return policy.syncGroupsEnabled
  return policy.syncChatsMetadataEnabled
}

async function persistNamedChat(
  source: string,
  chat: NamedChat,
  onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>,
  resolver?: ContactNameResolver,
  policy?: WhatsappDiscoveryPolicy,
): Promise<void> {
  const chatId = chat.id?.trim()
  if (!chatId) return
  const name = chat.subject ?? chat.name ?? null
  if (resolver) feedNamedChatToResolver(resolver, chat)
  logRc02BaileysEvent({
    event: source,
    count: 1,
    items: [
      {
        chatId,
        chatType: chatId.endsWith('@g.us') ? 'group' : 'other',
        name,
      },
    ],
  })
  logNamedGroupMatch(source, name ?? undefined, chatId)
  if (!shouldDiscoverChat(chatId, policy)) return
  if (onChatDiscovered) {
    await onChatDiscovered(chatId, name)
  }
}

/** Escuta eventos de grupo/chat do Baileys e persiste descoberta quando callback informado. */
export function attachGroupDiscoveryListeners(
  socket: {
    ev: { on(event: string, listener: (...args: unknown[]) => void): void }
  },
  options: {
    onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>
    resolver?: ContactNameResolver
    discoveryPolicy?: WhatsappDiscoveryPolicy
  } = {},
): void {
  const { onChatDiscovered, resolver, discoveryPolicy } = options

  socket.ev.on('groups.update', (updates: unknown) => {
    if (!Array.isArray(updates)) return
    for (const group of updates as NamedChat[]) {
      void persistNamedChat('groups.update', group, onChatDiscovered, resolver, discoveryPolicy)
    }
  })

  socket.ev.on('groups.upsert', (groups: unknown) => {
    if (!Array.isArray(groups)) return
    for (const group of groups as NamedChat[]) {
      void persistNamedChat('groups.upsert', group, onChatDiscovered, resolver, discoveryPolicy)
    }
  })

  socket.ev.on('chats.upsert', (payload: unknown) => {
    const chats = Array.isArray(payload)
      ? payload
      : (payload as { chats?: unknown[] } | undefined)?.chats
    if (!Array.isArray(chats)) return
    for (const chat of chats as NamedChat[]) {
      void persistNamedChat('chats.upsert', chat, onChatDiscovered, resolver, discoveryPolicy)
    }
  })

  socket.ev.on('chats.update', (updates: unknown) => {
    if (!Array.isArray(updates)) return
    for (const chat of updates as NamedChat[]) {
      void persistNamedChat('chats.update', chat, onChatDiscovered, resolver, discoveryPolicy)
    }
  })
}

export { shouldDiscoverChat }
