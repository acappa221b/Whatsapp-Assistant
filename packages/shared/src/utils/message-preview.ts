const PREVIEW_MAX_LENGTH = 120

/** Human-readable preview for chat sidebar — never returns empty string. */
export function resolveMessagePreview(
  content: string | null | undefined,
  messageType: string,
): string {
  const trimmed = content?.trim()
  if (trimmed && trimmed !== '—' && !trimmed.startsWith('[unclassified:')) {
    if (trimmed.length <= PREVIEW_MAX_LENGTH) return trimmed
    return `${trimmed.slice(0, PREVIEW_MAX_LENGTH)}…`
  }

  const type = messageType
  switch (type) {
    case 'TEXT':
      return 'Mensagem de texto'
    case 'AUDIO':
      return '[áudio]'
    case 'IMAGE':
      return '[imagem]'
    case 'VIDEO':
      return '[vídeo]'
    case 'DOCUMENT':
      return '[documento]'
    case 'STICKER':
      return '[sticker]'
    case 'REACTION':
      return '[reação]'
    case 'CONTACT':
      return '[contato]'
    case 'LOCATION':
      return '[localização]'
    case 'POLL':
      return '[enquete]'
    case 'SYSTEM':
      return '[sistema]'
    default:
      return '[mensagem]'
  }
}

/** Same logic as MessageArchiveView displayContent. */
export function resolveMessageDisplayContent(
  content: string | null | undefined,
  messageType: string,
): string {
  const trimmed = content?.trim()
  if (trimmed && trimmed !== '—' && !trimmed.startsWith('[unclassified:')) {
    return trimmed
  }
  return resolveMessagePreview(content, messageType)
}
