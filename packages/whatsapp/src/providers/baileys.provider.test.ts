import { describe, expect, it, vi } from 'vitest'
import { BaileysWhatsappProvider, type BaileysSocketEvents } from '../providers/baileys.provider'

describe('BaileysWhatsappProvider', () => {
  it('connect updates status and emits QR via onStatusChange', async () => {
    const provider = new BaileysWhatsappProvider({
      qrDataUrlGenerator: async (qr) => `data:image/png;base64,${qr}`,
      socketFactory: async ({ onQr, onConnectionUpdate }) => {
        const socket = createMockSocket()
        onQr('qr-token')
        await Promise.resolve()
        onConnectionUpdate({ connection: 'open' })
        return socket
      },
    })

    const statuses: string[] = []
    provider.onStatusChange((status) => statuses.push(status.status))
    await provider.connect()

    expect(statuses).toContain('connecting')
    expect(statuses).toContain('qr')
    expect(provider.getStatus().status).toBe('connected')
  })

  it('onMessage receives mapped incoming messages from any chat', async () => {
    let messageHandler: ((messages: unknown[]) => void) | undefined
    const provider = new BaileysWhatsappProvider({
      socketFactory: async ({ onMessages }) => {
        messageHandler = onMessages
        return createMockSocket()
      },
    })

    const received: string[] = []
    provider.onMessage((message) => {
      received.push(message.externalMessageId)
    })
    await provider.connect()
    await (messageHandler as (messages: unknown[]) => Promise<void>)([
      {
        key: { id: 'm1', remoteJid: '5511@s.whatsapp.net', fromMe: false },
        message: { conversation: 'Teste' },
        messageTimestamp: 1_718_000_000,
      },
      {
        key: {
          id: 'm2',
          remoteJid: '120363123456789012@g.us',
          fromMe: false,
          participant: '155650134945974@lid',
        },
        message: { conversation: 'grupo' },
        messageTimestamp: 1_718_000_001,
      },
    ])

    expect(received).toEqual(['m1', 'm2'])
    expect(provider.getStatus().messageCount).toBe(2)
  })

  it('sendMessage requires connected socket', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ key: { id: 'out-1' } })
    const provider = new BaileysWhatsappProvider({
      socketFactory: async ({ onConnectionUpdate }) => {
        onConnectionUpdate({ connection: 'open' })
        return { ...createMockSocket(), sendMessage }
      },
    })
    await provider.connect()
    await provider.sendMessage({ to: '5511@s.whatsapp.net', content: 'Teste IA: "oi"' })
    expect(sendMessage).toHaveBeenCalledWith('5511@s.whatsapp.net', { text: 'Teste IA: "oi"' })
  })

  it('sendMessage throws when not connected', async () => {
    const provider = new BaileysWhatsappProvider({
      socketFactory: async () => createMockSocket(),
    })
    await expect(provider.sendMessage({ to: 'x', content: 'y' })).rejects.toThrow(/not connected/)
  })

  it('disconnect clears session state', async () => {
    const provider = new BaileysWhatsappProvider({
      socketFactory: async ({ onConnectionUpdate }) => {
        onConnectionUpdate({ connection: 'open' })
        return createMockSocket()
      },
    })
    await provider.connect()
    await provider.disconnect()
    expect(provider.getStatus().status).toBe('disconnected')
  })

  it('does not auto-reconnect on bufferutil infrastructure disconnect', async () => {
    const connectCalls: number[] = []
    const provider = new BaileysWhatsappProvider({
      socketFactory: async ({ onConnectionUpdate }) => {
        connectCalls.push(Date.now())
        onConnectionUpdate({
          connection: 'close',
          lastDisconnect: { error: { message: 'bufferUtil.mask is not a function' } },
        })
        return createMockSocket()
      },
    })

    await provider.connect()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(connectCalls).toHaveLength(1)
    expect(provider.getStatus().status).toBe('disconnected')
  })

  it('connectFresh resets auth and starts connecting', async () => {
    const provider = new BaileysWhatsappProvider({
      authDir: `${process.cwd()}/tmp-rc03-session`,
      socketFactory: async ({ onQr }) => {
        onQr('fresh-qr')
        return createMockSocket()
      },
      qrDataUrlGenerator: async (qr) => `data:image/png;base64,${qr}`,
    })

    await provider.connectFresh()
    expect(provider.getStatus().status).toBe('qr')
    provider.clearAuthState()
  })
})

function createMockSocket(): BaileysSocketEvents {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  return {
    ev: {
      on(event: string, listener: (...args: unknown[]) => void) {
        const set = listeners.get(event) ?? new Set()
        set.add(listener)
        listeners.set(event, set)
      },
      removeAllListeners: vi.fn(),
    },
    end: vi.fn(),
  }
}
