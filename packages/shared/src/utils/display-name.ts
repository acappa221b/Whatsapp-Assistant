export const GENERIC_DISPLAY_NAMES = ['Contato', 'Grupo', 'Conversa'] as const

export function isJidLike(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.includes('@') || /^\d{10,}$/.test(trimmed)
}

export function isGenericDisplayName(value: string | null | undefined): boolean {
  if (!value?.trim()) return true
  const trimmed = value.trim()
  return (GENERIC_DISPLAY_NAMES as readonly string[]).includes(trimmed) || isJidLike(trimmed)
}

export function fallbackChatDisplayName(chatId: string): string {
  if (chatId.endsWith('@g.us')) return 'Grupo'
  if (chatId.endsWith('@lid')) {
    const lid = chatId.split('@')[0] ?? ''
    const tail = lid.slice(-6) || lid
    return `Chat sem identificação (#${tail})`
  }
  return 'Conversa'
}

export type ChatTypeLabel = 'Grupo' | 'Contato' | 'LID' | 'Outro'

export function getChatTypeLabel(chatId: string): ChatTypeLabel {
  if (chatId.endsWith('@g.us')) return 'Grupo'
  if (chatId.endsWith('@lid')) return 'LID'
  if (chatId.endsWith('@s.whatsapp.net')) return 'Contato'
  return 'Outro'
}

export function isChatNameResolved(chatName: string | null | undefined): boolean {
  const trimmed = chatName?.trim()
  return Boolean(trimmed && !isGenericDisplayName(trimmed))
}

/** RC-09 — Permissions/Messages label; never duplicate generic "Conversa". */
export function resolvePermissionsChatLabel(
  chatId: string,
  chatName: string | null | undefined,
): { label: string; resolved: boolean; pending: boolean } {
  if (isChatNameResolved(chatName)) {
    return { label: chatName!.trim(), resolved: true, pending: false }
  }
  if (chatId.endsWith('@lid')) {
    return {
      label: fallbackChatDisplayName(chatId),
      resolved: false,
      pending: false,
    }
  }
  return {
    label: '⏳ Resolvendo nome…',
    resolved: false,
    pending: true,
  }
}

export function resolveChatDisplayName(
  chatId: string,
  chatName: string | null | undefined,
): string {
  const trimmed = chatName?.trim()
  if (trimmed && !isGenericDisplayName(trimmed)) return trimmed
  return fallbackChatDisplayName(chatId)
}

export function resolveSenderDisplayName(senderName: string | null | undefined): string {
  const trimmed = senderName?.trim()
  if (trimmed && !isGenericDisplayName(trimmed)) return trimmed
  return 'Contato'
}

/** True when newName should replace existingName in persistence. */
export function isMoreInformativeName(
  newName: string | null | undefined,
  existingName: string | null | undefined,
): boolean {
  const newTrimmed = newName?.trim()
  if (!newTrimmed || isGenericDisplayName(newTrimmed)) return false
  const existingTrimmed = existingName?.trim()
  if (!existingTrimmed || isGenericDisplayName(existingTrimmed)) return true
  return false
}
