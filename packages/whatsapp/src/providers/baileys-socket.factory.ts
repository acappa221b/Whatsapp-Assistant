import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { RawBaileysMessage } from '../utils/baileys-message.util'
import type { BaileysSocketEvents } from './baileys.provider'
import {
  getBaileysPackageVersion,
  logAuthStateLoaded,
  logConnectionUpdate,
  type BaileysConnectionUpdate,
} from './baileys-connection-diagnostic'
import { traceQrFlow } from './qr-flow-trace'
import { attachGroupDiscoveryListeners } from '../utils/group-discovery'
import { attachContactDiscoveryListeners } from '../utils/contact-discovery'
import type { ContactNameResolver } from '../utils/contact-name-resolver'
import { ContactNameResolver as ContactNameResolverClass } from '../utils/contact-name-resolver'
import { shouldProcessMessageUpsert } from '../utils/baileys-upsert-policy'
import { syncHistoryChats, syncHistoryChatsFromMessages, collectMessageChatIds } from '../utils/history-sync'
import type { WhatsappDiscoveryPolicy } from '@finance-ai/shared'
import { logRc02BaileysEvent, logRc02WhatsappEventReceived } from '../utils/rc-02-diagnostic'

type ConnectionUpdate = BaileysConnectionUpdate

type BaileysExports = {
  makeWASocket: (config: Record<string, unknown>) => BaileysSocketEvents
  useMultiFileAuthState: (authDir: string) => Promise<{
    state: unknown
    saveCreds: () => Promise<void>
  }>
  fetchLatestBaileysVersion: () => Promise<{ version: number[]; isLatest: boolean }>
  Browsers: { macOS: (name: string) => [string, string, string] }
}

function findMonorepoRoots(): string[] {
  const roots = new Set<string>()
  let dir = process.cwd()
  for (let depth = 0; depth < 6; depth += 1) {
    roots.add(dir)
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) break
    dir = join(dir, '..')
  }
  return [...roots]
}

function resolveNodeModuleEntry(packageName: string, entryFile: string): string {
  const segments = packageName.split('/')
  const packageDir = join(...segments)

  for (const root of findMonorepoRoots()) {
    const candidates = [
      join(root, 'node_modules', packageDir, entryFile),
      join(root, 'packages', 'whatsapp', 'node_modules', packageDir, entryFile),
    ]

    const pnpmDir = join(root, 'node_modules', '.pnpm')
    if (existsSync(pnpmDir)) {
      const pnpmPrefix = segments.length > 1 ? `${segments[0]}+${segments[1]}@` : `${segments[0]}@`
      for (const folder of readdirSync(pnpmDir)) {
        if (!folder.startsWith(pnpmPrefix)) continue
        candidates.push(join(pnpmDir, folder, 'node_modules', packageDir, entryFile))
      }
    }

    for (const candidate of candidates) {
      if (existsSync(candidate)) return candidate
    }
  }

  throw new Error(`${packageName}/${entryFile} not found in node_modules`)
}

async function importFromNodeModules<T>(packageName: string, entryFile: string): Promise<T> {
  const entry = resolveNodeModuleEntry(packageName, entryFile)
  const imported = await import(/* webpackIgnore: true */ pathToFileURL(entry).href)
  const resolved = (imported as { default?: T }).default ?? imported
  return resolved as T
}

async function loadBaileysExports(): Promise<BaileysExports> {
  const baileys = await importFromNodeModules<Record<string, unknown>>(
    '@whiskeysockets/baileys',
    'lib/index.js',
  )

  const makeWASocket = baileys.makeWASocket
  if (typeof makeWASocket !== 'function') {
    throw new Error('Failed to load makeWASocket from @whiskeysockets/baileys')
  }

  return baileys as unknown as BaileysExports
}

export async function generateQrDataUrl(qr: string): Promise<string> {
  const QRCode = await importFromNodeModules<{ toDataURL: (value: string) => Promise<string> }>(
    'qrcode',
    'lib/index.js',
  )
  return QRCode.toDataURL(qr)
}

export async function createDefaultBaileysSocket(options: {
  authDir: string
  onQr: (qr: string) => void
  onConnectionUpdate: (update: ConnectionUpdate) => void
  onMessages: (messages: RawBaileysMessage[]) => void | Promise<void>
  onCredsUpdate: () => void | Promise<void>
  onChatDiscovered?: (chatId: string, name?: string | null) => void | Promise<void>
  onContactDiscovered?: (jid: string, name: string) => void | Promise<void>
  contactNameResolver?: ContactNameResolver
  importHistoryEnabled?: boolean
  discoveryPolicy?: WhatsappDiscoveryPolicy
}): Promise<BaileysSocketEvents> {
  const importHistoryEnabled = options.importHistoryEnabled ?? false
  const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers } =
    await loadBaileysExports()
  const pino = await importFromNodeModules<(options: { level: string }) => unknown>('pino', 'pino.js')

  const baileysVersion = getBaileysPackageVersion()
  const { state, saveCreds } = await useMultiFileAuthState(options.authDir)
  const authState = state as { creds?: { registered?: boolean; me?: unknown } }

  logAuthStateLoaded({
    authDir: options.authDir,
    baileysVersion,
    stateLoaded: Boolean(state),
    hasCreds: Boolean(authState.creds),
  })

  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.info('[baileys/diagnostic] wa web version', { version: version.join('.'), isLatest })

  const socket = makeWASocket({
    auth: state,
    version,
    browser: Browsers.macOS('Finance AI'),
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    syncFullHistory: importHistoryEnabled,
  })

  socket.ev.on('connection.update', (update: ConnectionUpdate) => {
    logRc02BaileysEvent({
      event: 'connection.update',
      connection: update.connection ?? null,
      hasQr: Boolean(update.qr),
      statusCode: update.lastDisconnect?.error?.output?.statusCode ?? null,
    })
    traceQrFlow('baileys', 'connection.update:raw-entry', {
      hasQr: Boolean(update.qr),
      qrLength: update.qr?.length ?? 0,
      qrPrefix: update.qr ? update.qr.slice(0, 12) : null,
      connection: update.connection ?? null,
      keys: Object.keys(update),
    })
    logConnectionUpdate(update)
    options.onConnectionUpdate(update)
    if (update.qr) options.onQr(update.qr)
  })
  socket.ev.on('creds.update', () => {
    void saveCreds()
    void options.onCredsUpdate()
  })
  socket.ev.on(
    'messages.upsert',
    ({ messages, type }: { messages: RawBaileysMessage[]; type?: string }) => {
      logRc02WhatsappEventReceived({
        event: 'messages.upsert',
        type: type ?? null,
        count: messages.length,
        items: messages.map((message) => ({
          chatId: message.key.remoteJid ?? null,
          chatType: message.key.remoteJid?.endsWith('@g.us')
            ? 'group'
            : message.key.remoteJid?.endsWith('@lid')
              ? 'lid'
              : 'other',
          messageId: message.key.id ?? null,
          fromMe: message.key.fromMe ?? false,
        })),
      })
      if (!shouldProcessMessageUpsert(type, importHistoryEnabled)) return
      void options.onMessages(messages)
    },
  )

  socket.ev.on('messaging-history.set', (payload: unknown) => {
    const data = payload as {
      chats?: Array<{ id?: string; name?: string; subject?: string }>
      messages?: RawBaileysMessage[]
      isLatest?: boolean
    }

    logRc02BaileysEvent({
      event: 'messaging-history.set',
      chatCount: data.chats?.length ?? 0,
      messageCount: data.messages?.length ?? 0,
      isLatest: data.isLatest ?? null,
    })

    void (async () => {
      const messageChatIds = collectMessageChatIds(data.messages)
      const discovered = options.discoveryPolicy?.syncChatsMetadataEnabled
        ? await syncHistoryChats(data.chats, options.onChatDiscovered, { enabled: true })
        : await syncHistoryChatsFromMessages(
            data.chats,
            messageChatIds,
            options.onChatDiscovered,
          )
      if (discovered > 0) {
        console.info('[RC-16/chat-sync]', {
          at: new Date().toISOString(),
          discovered,
          source: 'messaging-history.set',
        })
      }
      if (importHistoryEnabled && data.messages?.length) {
        void options.onMessages(data.messages)
      }
    })()
  })

  const resolver =
    options.contactNameResolver ??
    new ContactNameResolverClass({
      onGroupNameResolved: async (chatId, name) => {
        await options.onChatDiscovered?.(chatId, name)
      },
    })

  const socketWithMetadata = socket as BaileysSocketEvents & {
    groupMetadata?: (jid: string) => Promise<{ subject?: string }>
  }
  if (typeof socketWithMetadata.groupMetadata === 'function') {
    resolver.setGroupMetadataFetcher((jid) => socketWithMetadata.groupMetadata!(jid))
  }

  attachGroupDiscoveryListeners(socket, {
    onChatDiscovered: options.onChatDiscovered,
    resolver,
    discoveryPolicy: options.discoveryPolicy,
  })
  attachContactDiscoveryListeners(socket, {
    resolver,
    onContactDiscovered: options.onContactDiscovered,
    syncAddressBookEnabled: options.discoveryPolicy?.syncAddressBookEnabled ?? false,
  })

  return socket
}
