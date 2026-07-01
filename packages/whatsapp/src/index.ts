import type { WhatsappConnectionStatus } from '@finance-ai/core/domain/value-objects/whatsapp-enums'
import type { IncomingMessage } from './types/incoming-message'

export type { IncomingMessage } from './types/incoming-message'

export interface OutgoingMessage {
  to: string
  content: string
  metadata?: { source: 'agent-auto-reply'; messageId?: string }
}

export interface WhatsappStatus {
  status: WhatsappConnectionStatus
  qrCode: string | null
  qrCodeDataUrl: string | null
  lastConnectedAt: Date | null
  messageCount: number
  authenticated: boolean
  /** RC-07 — user-facing message (conflict, session expired, etc.) */
  operationalMessage?: string | null
}

export interface WhatsappProvider {
  connect(): Promise<void>
  connectFresh(): Promise<void>
  disconnect(): Promise<void>
  /** RC-30 — disconnect and reconnect without clearing session (triggers history/contacts sync) */
  reconnectForSync?(): Promise<void>
  clearAuthState(): void
  getStatus(): WhatsappStatus
  onMessage(handler: (message: IncomingMessage) => Promise<void> | void): () => void
  onStatusChange(handler: (status: WhatsappStatus) => void): () => void
  sendMessage(message: OutgoingMessage): Promise<void>
}

export * from './providers/baileys.provider'
export { ContactNameResolver } from './utils/contact-name-resolver'
export { attachContactDiscoveryListeners } from './utils/contact-discovery'
export { isValidAuthSession, inspectAuthSession, getOwnJidFromAuthSession } from './providers/baileys-connection-diagnostic'
export { ChatContactResolver } from './utils/chat-contact-resolver'
export * from './pipeline/whatsapp-message.pipeline'
export * from './pipeline/whatsapp-connection.pipeline'
export * from './metrics/capture-metrics'
