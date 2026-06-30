export type HistoryChat = {
  id?: string
  name?: string
  subject?: string
}

export async function syncHistoryChats(
  chats: HistoryChat[] | undefined,
  onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>,
  options?: { enabled?: boolean },
): Promise<number> {
  if (options?.enabled === false) return 0
  if (!Array.isArray(chats) || !onChatDiscovered) return 0

  let count = 0
  for (const chat of chats) {
    const chatId = chat.id?.trim()
    if (!chatId) continue
    const name = chat.subject ?? chat.name ?? null
    await onChatDiscovered(chatId, name)
    count += 1
  }
  return count
}

/** RC-22A — discover only chats that also appear in imported history messages. */
export async function syncHistoryChatsFromMessages(
  chats: HistoryChat[] | undefined,
  messageChatIds: Set<string>,
  onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>,
): Promise<number> {
  if (!onChatDiscovered || messageChatIds.size === 0) return 0

  const chatById = new Map<string, HistoryChat>()
  for (const chat of chats ?? []) {
    const chatId = chat.id?.trim()
    if (chatId) chatById.set(chatId, chat)
  }

  let count = 0
  for (const chatId of messageChatIds) {
    const chat = chatById.get(chatId)
    const name = chat?.subject ?? chat?.name ?? null
    await onChatDiscovered(chatId, name)
    count += 1
  }
  return count
}

export function collectMessageChatIds(
  messages: Array<{ key?: { remoteJid?: string | null } }> | undefined,
): Set<string> {
  const ids = new Set<string>()
  for (const message of messages ?? []) {
    const chatId = message.key?.remoteJid?.trim()
    if (chatId) ids.add(chatId)
  }
  return ids
}
