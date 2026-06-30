import { mkdirSync, rmSync } from 'node:fs'
import type { WhatsappConnectionStatus } from '@finance-ai/core/domain/value-objects/whatsapp-enums'
import { config } from '@finance-ai/shared/config'
import type { IncomingMessage, OutgoingMessage, WhatsappProvider, WhatsappStatus } from '../index'
import { whatsappMediaRegistry } from '../media/media-registry'
import { mapBaileysMessage, type RawBaileysMessage } from '../utils/baileys-message.util'
import { ContactNameResolver } from '../utils/contact-name-resolver'
import {
  computeReconnectDelayMs,
  conflictOperationalMessage,
  shouldAutoReconnect,
  SOCKET_EVENT_NAMES,
} from '../utils/baileys-reconnect'
import { logRc07 } from '@finance-ai/shared/utils'
import { getSharedAppLogger } from '@finance-ai/shared/logging'
import { recordMessageReceived } from '../metrics/capture-metrics'
import { logIncomingMessageDiscovery } from '../utils/group-discovery'
import {
  logRc02MessageUpsertStart,
  resolveChatType,
} from '../utils/rc-02-diagnostic'
import {
  inspectAuthSession,
  logProviderQrReceived,
  logProviderStatusChange,
} from './baileys-connection-diagnostic'
import { traceQrFlow } from './qr-flow-trace'

export type BaileysSocketEvents = {
  ev: {
    on(event: 'connection.update', listener: (update: ConnectionUpdate) => void): void
    on(event: 'creds.update', listener: () => void): void
    on(
      event: 'messages.upsert',
      listener: (payload: { messages: RawBaileysMessage[] }) => void | Promise<void>,
    ): void
    on(event: string, listener: (...args: unknown[]) => void): void
    removeAllListeners: (event?: string) => void
  }
  end: (error?: Error) => void
  sendMessage?: (
    jid: string,
    content: { text: string },
  ) => Promise<{ key?: { id?: string; remoteJid?: string } }>
}

type ConnectionUpdate = {
  connection?: 'close' | 'open' | 'connecting'
  qr?: string
  lastDisconnect?: {
    error?: { output?: { statusCode?: number }; message?: string }
  }
}

export type BaileysSocketFactory = (options: {
  authDir: string
  onQr: (qr: string) => void
  onConnectionUpdate: (update: ConnectionUpdate) => void
  onMessages: (messages: RawBaileysMessage[]) => void | Promise<void>
  onCredsUpdate: () => void | Promise<void>
  onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>
  onContactDiscovered?: (jid: string, name: string) => void | Promise<void>
  contactNameResolver?: ContactNameResolver
  importHistoryEnabled?: boolean
}) => Promise<BaileysSocketEvents>

export type BaileysWhatsappProviderOptions = {
  authDir?: string
  socketFactory?: BaileysSocketFactory
  qrDataUrlGenerator?: (qr: string) => Promise<string>
  onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>
  onContactDiscovered?: (jid: string, name: string) => void | Promise<void>
  onConnectionOpen?: () => void | Promise<void>
  contactNameResolver?: ContactNameResolver
  getImportHistoryEnabled?: () => boolean | Promise<boolean>
}

const defaultStatus = (): WhatsappStatus => ({
  status: 'disconnected',
  qrCode: null,
  qrCodeDataUrl: null,
  lastConnectedAt: null,
  messageCount: 0,
  authenticated: false,
  operationalMessage: null,
})

export class BaileysWhatsappProvider implements WhatsappProvider {
  private status: WhatsappStatus = defaultStatus()
  private readonly messageHandlers = new Set<(message: IncomingMessage) => Promise<void> | void>()
  private readonly statusHandlers = new Set<(status: WhatsappStatus) => void>()
  private socket: BaileysSocketEvents | null = null
  private allowReconnect = true
  private connectingInFlight: Promise<void> | null = null
  private reconnectAttempt = 0
  private socketInstanceCounter = 0
  private currentSocketInstanceId = 0
  private connectionOpenedAt: number | null = null
  private readonly authDir: string
  private readonly socketFactory: BaileysSocketFactory
  private readonly qrDataUrlGenerator: (qr: string) => Promise<string>
  private readonly onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>
  private readonly onContactDiscovered?: (jid: string, name: string) => void | Promise<void>
  private readonly onConnectionOpen?: () => void | Promise<void>
  private readonly contactNameResolver: ContactNameResolver
  private readonly getImportHistoryEnabled?: () => boolean | Promise<boolean>

  constructor(options: BaileysWhatsappProviderOptions = {}) {
    this.authDir = options.authDir ?? config.whatsapp.sessionPath
    this.socketFactory = options.socketFactory ?? defaultSocketFactory
    this.qrDataUrlGenerator = options.qrDataUrlGenerator ?? defaultQrDataUrlGenerator
    this.onChatDiscovered = options.onChatDiscovered
    this.onContactDiscovered = options.onContactDiscovered
    this.onConnectionOpen = options.onConnectionOpen
    this.contactNameResolver = options.contactNameResolver ?? new ContactNameResolver()
    this.getImportHistoryEnabled = options.getImportHistoryEnabled
  }

  async connect(): Promise<void> {
    if (this.status.status === 'connected') {
      return
    }
    if (this.connectingInFlight) {
      return this.connectingInFlight
    }
    this.connectingInFlight = this.doConnect().finally(() => {
      this.connectingInFlight = null
    })
    return this.connectingInFlight
  }

  private async doConnect(): Promise<void> {
    if (this.socket) {
      await this.teardownConnection()
    }

    try {
      await this.startConnection()
    } catch (error) {
      await this.teardownConnection()
      if (!this.isRecoverableSessionError(error)) {
        getSharedAppLogger().error('[baileys] connect failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        throw error
      }

      console.warn('[baileys] recoverable session error detected, resetting auth state', error)
      this.resetSessionFiles()
      try {
        await this.startConnection()
      } catch (retryError) {
        await this.teardownConnection()
        throw retryError
      }
    }
  }

  private removeAllSocketListeners(): void {
    if (!this.socket) return
    for (const event of SOCKET_EVENT_NAMES) {
      this.socket.ev.removeAllListeners(event)
    }
  }

  private async teardownConnection(): Promise<void> {
    if (this.socket) {
      console.info('[RC-07/teardown]', {
        at: new Date().toISOString(),
        socketInstanceId: this.currentSocketInstanceId,
      })
      this.removeAllSocketListeners()
      this.socket.end()
      this.socket = null
      this.currentSocketInstanceId = 0
    }
    if (this.status.status !== 'disconnected') {
      await this.updateStatus({
        status: 'disconnected',
        qrCode: null,
        qrCodeDataUrl: null,
        authenticated: false,
      })
    }
  }

  private async startConnection(): Promise<void> {
    mkdirSync(this.authDir, { recursive: true })
    const session = inspectAuthSession(this.authDir)
    this.socketInstanceCounter += 1
    const socketInstanceId = this.socketInstanceCounter
    console.info('[baileys/diagnostic] connect start', {
      authDir: session.absolutePath,
      sessionExists: session.exists,
      sessionFileCount: session.fileCount,
      sessionFiles: session.files,
      currentProviderStatus: this.status.status,
      socketInstanceId,
    })
    this.allowReconnect = true
    await this.updateStatus({
      status: 'connecting',
      qrCode: null,
      qrCodeDataUrl: null,
      operationalMessage: null,
    })

    this.socket = await this.socketFactory({
      authDir: this.authDir,
      onQr: (qr) => {
        void this.handleQr(qr)
      },
      onConnectionUpdate: (update) => {
        void this.handleConnectionUpdate(update, socketInstanceId)
      },
      onMessages: (messages) => this.handleMessages(messages),
      onCredsUpdate: async () => {},
      onChatDiscovered: this.onChatDiscovered,
      onContactDiscovered: this.onContactDiscovered,
      contactNameResolver: this.contactNameResolver,
      importHistoryEnabled: this.getImportHistoryEnabled
        ? await Promise.resolve(this.getImportHistoryEnabled())
        : false,
    })
    this.currentSocketInstanceId = socketInstanceId
  }

  private isRecoverableSessionError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    return (
      message.includes('bad mac') ||
      message.includes('unable to authenticate') ||
      message.includes('invalid session') ||
      message.includes('conflict') ||
      message.includes('econnreset')
    )
  }

  private resetSessionFiles(): void {
    this.teardownConnectionSync()
    rmSync(this.authDir, { recursive: true, force: true })
  }

  private teardownConnectionSync(): void {
    if (this.socket) {
      this.removeAllSocketListeners()
      this.socket.end()
      this.socket = null
      this.currentSocketInstanceId = 0
    }
  }

  async disconnect(): Promise<void> {
    this.allowReconnect = false
    await this.teardownConnection()
  }

  clearAuthState(): void {
    rmSync(this.authDir, { recursive: true, force: true })
  }

  async connectFresh(): Promise<void> {
    await this.disconnect()
    this.clearAuthState()
    await this.connect()
  }

  getStatus(): WhatsappStatus {
    return { ...this.status }
  }

  onMessage(handler: (message: IncomingMessage) => Promise<void> | void): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onStatusChange(handler: (status: WhatsappStatus) => void): () => void {
    this.statusHandlers.add(handler)
    handler(this.getStatus())
    return () => this.statusHandlers.delete(handler)
  }

  async sendMessage(message: OutgoingMessage): Promise<void> {
    if (this.status.status !== 'connected') {
      throw new Error('WhatsApp not connected')
    }
    if (!this.socket?.sendMessage) {
      throw new Error('Baileys socket sendMessage unavailable')
    }
    await this.socket.sendMessage(message.to, { text: message.content })
  }

  private async handleQr(qr: string): Promise<void> {
    traceQrFlow('provider', 'handleQr:entry', {
      qrLength: qr.length,
      qrPrefix: qr.slice(0, 12),
      currentStatus: this.status.status,
      hadQrCode: Boolean(this.status.qrCode),
      hadQrDataUrl: Boolean(this.status.qrCodeDataUrl),
    })
    if (this.status.status === 'connected') {
      traceQrFlow('provider', 'handleQr:skipped-connected', {})
      return
    }
    const qrCodeDataUrl = await this.qrDataUrlGenerator(qr)
    logProviderQrReceived({
      qrLength: qr.length,
      providerStatus: this.status.status,
      qrDataUrlGenerated: Boolean(qrCodeDataUrl),
    })
    if (this.getStatus().status !== 'connected') {
      await this.updateStatus({ status: 'qr', qrCode: qr, qrCodeDataUrl })
    }
  }

  private async handleConnectionUpdate(
    update: ConnectionUpdate,
    socketInstanceId: number,
  ): Promise<void> {
    const statusCode = update.lastDisconnect?.error?.output?.statusCode
    const disconnectMessage =
      update.lastDisconnect?.error?.message != null
        ? String(update.lastDisconnect.error.message)
        : ''
    const openDurationMs =
      update.connection === 'close' && this.connectionOpenedAt
        ? Date.now() - this.connectionOpenedAt
        : null

    console.info('[RC-07/connection.update]', {
      at: new Date().toISOString(),
      connection: update.connection ?? null,
      statusCode: statusCode ?? null,
      disconnectMessage: disconnectMessage || null,
      socketInstanceId,
      activeSocketInstanceId: this.currentSocketInstanceId,
      openDurationMs,
      reconnectAttempt: this.reconnectAttempt,
    })

    if (update.connection === 'open') {
      this.reconnectAttempt = 0
      this.connectionOpenedAt = Date.now()
      await this.updateStatus({
        status: 'connected',
        qrCode: null,
        qrCodeDataUrl: null,
        lastConnectedAt: new Date(),
        authenticated: true,
        operationalMessage: null,
      })
      if (this.onConnectionOpen) {
        void Promise.resolve(this.onConnectionOpen()).catch((error) => {
          console.warn('[RC-07/onConnectionOpen] bootstrap failed', error)
        })
      }
      return
    }

    if (update.connection === 'close') {
      this.connectionOpenedAt = null
      const operationalMessage = conflictOperationalMessage(statusCode)
      const isInfrastructureDisconnect =
        disconnectMessage.toLowerCase().includes('bufferutil') ||
        disconnectMessage.toLowerCase().includes('utf-8-validate')

      if (statusCode === 440) {
        this.allowReconnect = false
        console.warn('[RC-07/reconnect] suppressed — session conflict (440)', {
          socketInstanceId,
        })
      }

      if (isInfrastructureDisconnect) {
        this.allowReconnect = false
        console.error('[baileys] infrastructure disconnect — auto-reconnect disabled', {
          message: disconnectMessage,
        })
      }

      const shouldReconnect = shouldAutoReconnect({
        autoReconnectEnabled: config.whatsapp.autoReconnect,
        allowReconnect: this.allowReconnect,
        statusCode,
        disconnectMessage,
      })

      if (!shouldReconnect) {
        console.info('[RC-07/reconnect] suppressed', {
          statusCode: statusCode ?? null,
          allowReconnect: this.allowReconnect,
          autoReconnect: config.whatsapp.autoReconnect,
        })
      }

      await this.updateStatus({
        status: 'disconnected',
        qrCode: null,
        qrCodeDataUrl: null,
        authenticated: false,
        operationalMessage: operationalMessage ?? this.status.operationalMessage,
      })

      if (shouldReconnect && this.allowReconnect) {
        this.reconnectAttempt += 1
        const delayMs = computeReconnectDelayMs(
          config.whatsapp.reconnectDelayMs,
          this.reconnectAttempt - 1,
        )
        console.info('[RC-07/reconnect] scheduled', {
          attempt: this.reconnectAttempt,
          delayMs,
        })
        await new Promise((resolve) => setTimeout(resolve, delayMs))
        await this.connect()
      }
    }
  }

  private async handleMessages(messages: RawBaileysMessage[]): Promise<void> {
    for (const raw of messages) {
      logIncomingMessageDiscovery(raw)
      logRc02MessageUpsertStart({
        chatId: raw.key.remoteJid ?? null,
        chatType: resolveChatType(raw.key.remoteJid),
        messageId: raw.key.id ?? null,
        fromMe: raw.key.fromMe ?? false,
      })

      whatsappMediaRegistry.register(raw)
      const mapped = mapBaileysMessage(raw, { resolver: this.contactNameResolver })
      logRc07('PARSER', {
        messageId: mapped.externalMessageId,
        chatId: mapped.chatId,
        messageType: mapped.messageType,
        contentLength: mapped.content.length,
        fromMe: mapped.fromMe,
      })
      if (mapped.chatId.endsWith('@g.us') && !mapped.chatName) {
        this.contactNameResolver.enrichGroupMetadataAsync(mapped.chatId)
      }
      recordMessageReceived(mapped.messageType)

      const incoming: IncomingMessage = {
        ...mapped,
        mediaUrl:
          mapped.messageType === 'IMAGE' ||
          mapped.messageType === 'DOCUMENT' ||
          mapped.messageType === 'VIDEO'
            ? `baileys://${mapped.externalMessageId}`
            : mapped.mediaUrl,
      }
      this.status = { ...this.status, messageCount: this.status.messageCount + 1 }
      this.notifyStatusHandlers()
      await Promise.all([...this.messageHandlers].map((handler) => Promise.resolve(handler(incoming))))
    }
  }

  private async updateStatus(partial: Partial<WhatsappStatus> & { status: WhatsappConnectionStatus }) {
    this.status = { ...this.status, ...partial }
    logProviderStatusChange({
      status: this.status.status,
      qrCode: this.status.qrCode,
      qrCodeDataUrl: this.status.qrCodeDataUrl,
    })
    this.notifyStatusHandlers()
  }

  private notifyStatusHandlers(): void {
    const snapshot = this.getStatus()
    for (const handler of this.statusHandlers) {
      handler(snapshot)
    }
  }
}

const defaultSocketFactory: BaileysSocketFactory = async (options) => {
  const { createDefaultBaileysSocket } = await import('./baileys-socket.factory')
  return createDefaultBaileysSocket(options)
}

const defaultQrDataUrlGenerator = async (qr: string): Promise<string> => {
  const { generateQrDataUrl } = await import('./baileys-socket.factory')
  return generateQrDataUrl(qr)
}
