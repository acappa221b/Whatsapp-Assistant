export type MessageUpsertType = 'notify' | 'append' | string | undefined

/** notify = live message; append = history batch (only when import is enabled). */
export function shouldProcessMessageUpsert(
  type: MessageUpsertType,
  importHistoryEnabled: boolean,
): boolean {
  if (type === 'append') return importHistoryEnabled
  return true
}
