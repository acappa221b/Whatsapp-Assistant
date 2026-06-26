import type { ParsedEnv } from './env.schema'
import { resolveRepoRelativePath } from './paths'

export type WhatsappConfig = {
  sessionPath: string
  monitoredChatId: string
  ignoreHistory: boolean
  autoReconnect: boolean
  reconnectDelayMs: number
}

export function createWhatsappConfig(env: ParsedEnv): WhatsappConfig {
  return {
    sessionPath: resolveRepoRelativePath(env.WHATSAPP_SESSION_PATH),
    monitoredChatId: env.WHATSAPP_MONITORED_CHAT_ID.trim(),
    ignoreHistory: env.WHATSAPP_IGNORE_HISTORY,
    autoReconnect: env.WHATSAPP_AUTO_RECONNECT,
    reconnectDelayMs: env.WHATSAPP_RECONNECT_DELAY_MS,
  }
}
