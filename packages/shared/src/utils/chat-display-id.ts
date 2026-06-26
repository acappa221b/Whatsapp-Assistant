export function formatChatDisplayId(displayNumber: number): string {
  return `#${displayNumber}`
}

export function formatChatListLabel(displayNumber: number, name: string | null | undefined): string {
  const id = formatChatDisplayId(displayNumber)
  const trimmed = name?.trim()
  if (trimmed) return `${id} ${trimmed}`
  return `${id} (sem nome)`
}
