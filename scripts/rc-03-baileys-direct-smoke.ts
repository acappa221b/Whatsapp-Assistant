/**
 * Smoke test Baileys fora do Next.js — valida handshake + QR.
 */
import { createRequire } from 'node:module'
import { mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const require = createRequire(import.meta.url)

async function main() {
  const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers,
  } = require('@whiskeysockets/baileys') as {
    default: (config: Record<string, unknown>) => { ev: { on: (e: string, l: (u: unknown) => void) => void }; end: () => void }
    useMultiFileAuthState: (dir: string) => Promise<{ state: unknown; saveCreds: () => Promise<void> }>
    fetchLatestBaileysVersion: () => Promise<{ version: number[]; isLatest: boolean }>
    Browsers: { macOS: (name: string) => [string, string, string] }
  }
  const pino = require('pino') as (options: { level: string }) => unknown

  const authDir = mkdtempSync(join(tmpdir(), 'baileys-rc03-'))
  const { state, saveCreds } = await useMultiFileAuthState(authDir)
  const { version, isLatest } = await fetchLatestBaileysVersion()
  console.log('baileys version', version.join('.'), 'isLatest', isLatest)

  let qrReceived = false
  const socket = makeWASocket({
    auth: state,
    version,
    browser: Browsers.macOS('Finance AI'),
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    syncFullHistory: false,
  })

  socket.ev.on('creds.update', () => {
    void saveCreds()
  })

  socket.ev.on('connection.update', (update: {
    connection?: string
    qr?: string
    lastDisconnect?: { error?: { message?: string; output?: { statusCode?: number } } }
  }) => {
    console.log('connection.update', JSON.stringify({
      connection: update.connection,
      qrPresent: Boolean(update.qr),
      qrLength: update.qr?.length ?? 0,
      error: update.lastDisconnect?.error?.message ?? null,
      statusCode: update.lastDisconnect?.error?.output?.statusCode ?? null,
    }))
    if (update.qr) {
      qrReceived = true
      console.log('QR_OK', update.qr.slice(0, 32))
      socket.end()
      rmSync(authDir, { recursive: true, force: true })
      process.exit(0)
    }
    if (update.connection === 'close' && !qrReceived) {
      setTimeout(() => {
        socket.end()
        rmSync(authDir, { recursive: true, force: true })
        process.exit(qrReceived ? 0 : 1)
      }, 2000)
    }
  })

  await new Promise((resolve) => setTimeout(resolve, 15000))
  socket.end()
  rmSync(authDir, { recursive: true, force: true })
  process.exit(qrReceived ? 0 : 1)
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
