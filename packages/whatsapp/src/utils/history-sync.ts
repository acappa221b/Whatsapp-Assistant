export type HistoryChat = {
  id?: string
  name?: string
  subject?: string
}

export async function syncHistoryChats(
  chats: HistoryChat[] | undefined,
  onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>,
): Promise<number> {
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
