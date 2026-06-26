import { config } from '@finance-ai/shared/config'

/** Quando vazio, todas as origens são aceitas (sem whitelist). */
export function resolveMonitoredChatId(override?: string): string {
  const fromConfig = config.whatsapp.monitoredChatId?.trim() ?? ''
  return (override ?? fromConfig).trim()
}

export function isAllowedWhatsappOrigin(
  remoteJid: string | undefined,
  monitoredChatId?: string,
): boolean {
  const monitored = resolveMonitoredChatId(monitoredChatId)
  if (!monitored) return true

  const jid = remoteJid?.trim()
  if (!jid) return false

  return jid === monitored
}

export function logFilteredWhatsappOrigin(
  remoteJid: string | undefined,
  participant?: string | boolean,
): void {
  const sender =
    typeof participant === 'string'
      ? participant
      : participant === true
        ? 'fromMe'
        : 'n/a'
  console.debug(
    `[Pipeline/Filter] Mensagem ignorada: conversa ${remoteJid?.trim() ?? 'unknown'} (participante ${sender}) não autorizada — filtro usa remoteJid (@g.us), não o remetente`,
  )
}
