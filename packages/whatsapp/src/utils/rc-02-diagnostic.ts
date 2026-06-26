type Rc02LogPayload = Record<string, unknown>

function emit(tag: string, payload: Rc02LogPayload = {}): void {
  console.info(`[RC-02/${tag}]`, {
    at: new Date().toISOString(),
    ...payload,
  })
}

export function logRc02WhatsappEventReceived(payload: Rc02LogPayload): void {
  emit('WHATSAPP_EVENT_RECEIVED', payload)
}

export function logRc02MessageUpsertStart(payload: Rc02LogPayload): void {
  emit('MESSAGE_UPSERT_START', payload)
}

export function logRc02MessageUpsertSuccess(payload: Rc02LogPayload): void {
  emit('MESSAGE_UPSERT_SUCCESS', payload)
}

export function logRc02MessageUpsertFailed(payload: Rc02LogPayload): void {
  emit('MESSAGE_UPSERT_FAILED', payload)
}

export function logRc02ChatUpsertStart(payload: Rc02LogPayload): void {
  emit('CHAT_UPSERT_START', payload)
}

export function logRc02ChatUpsertSuccess(payload: Rc02LogPayload): void {
  emit('CHAT_UPSERT_SUCCESS', payload)
}

export function logRc02ChatUpsertFailed(payload: Rc02LogPayload): void {
  emit('CHAT_UPSERT_FAILED', payload)
}

export function logRc02EventBusPublish(payload: Rc02LogPayload): void {
  emit('EVENT_BUS_PUBLISH', payload)
}

export function logRc02BaileysEvent(payload: Rc02LogPayload): void {
  emit('BAILEYS_EVENT', payload)
}

export function resolveChatType(chatId: string | undefined): string {
  if (!chatId) return 'unknown'
  if (chatId.endsWith('@g.us')) return 'group'
  if (chatId.endsWith('@lid')) return 'lid'
  if (chatId.endsWith('@s.whatsapp.net')) return 'dm'
  if (chatId === 'status@broadcast') return 'status'
  return 'other'
}
