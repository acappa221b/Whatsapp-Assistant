export const ARCHIVE_MESSAGE_TYPES = [
  'TEXT',
  'AUDIO',
  'IMAGE',
  'DOCUMENT',
  'VIDEO',
  'STICKER',
  'REACTION',
  'CONTACT',
  'LOCATION',
  'POLL',
  'SYSTEM',
  'UNKNOWN',
] as const

export type ArchiveMessageType = (typeof ARCHIVE_MESSAGE_TYPES)[number]

export function isArchiveMessageType(value: string): value is ArchiveMessageType {
  return (ARCHIVE_MESSAGE_TYPES as readonly string[]).includes(value)
}

/** Maps archive types to legacy MessageType where needed (finance pipeline). */
export function toLegacyMessageType(type: ArchiveMessageType): string {
  if (type === 'VIDEO') return 'IMAGE'
  if (type === 'STICKER' || type === 'REACTION' || type === 'CONTACT') return 'UNKNOWN'
  if (type === 'LOCATION' || type === 'POLL' || type === 'SYSTEM') return 'UNKNOWN'
  return type
}
