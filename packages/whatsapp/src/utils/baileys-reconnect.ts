/** RC-07 — Baileys reconnect policy and backoff helpers */

export const NO_RECONNECT_STATUS_CODES = new Set([
  401, // logged out
  403, // forbidden
  405, // method not allowed / banned
  409, // conflict variant
  411, // length required / session invalid
  440, // conflict — another WhatsApp Web session
  500, // restart required
])

export const SOCKET_EVENT_NAMES = [
  'connection.update',
  'creds.update',
  'messages.upsert',
  'contacts.upsert',
  'contacts.update',
  'groups.update',
  'groups.upsert',
  'chats.upsert',
  'chats.update',
  'messaging-history.set',
] as const

export function shouldAutoReconnect(input: {
  autoReconnectEnabled: boolean
  allowReconnect: boolean
  statusCode: number | undefined
  disconnectMessage: string
}): boolean {
  if (!input.autoReconnectEnabled || !input.allowReconnect) return false
  if (input.statusCode !== undefined && NO_RECONNECT_STATUS_CODES.has(input.statusCode)) {
    return false
  }
  const msg = input.disconnectMessage.toLowerCase()
  if (msg.includes('bufferutil') || msg.includes('utf-8-validate')) return false
  return true
}

export function computeReconnectDelayMs(
  baseDelayMs: number,
  attempt: number,
  maxDelayMs = 60_000,
): number {
  const base = baseDelayMs > 0 ? baseDelayMs : 5_000
  const exponent = Math.min(attempt, 4)
  const delay = Math.min(base * 2 ** exponent, maxDelayMs)
  const jitter = Math.floor(Math.random() * 1_000)
  return delay + jitter
}

export function conflictOperationalMessage(statusCode: number | undefined): string | null {
  if (statusCode === 440) {
    return 'Conflito de sessão: feche WhatsApp Web no celular/navegador e reconecte.'
  }
  if (statusCode === 401) {
    return 'Sessão expirada — escaneie o QR novamente.'
  }
  return null
}
