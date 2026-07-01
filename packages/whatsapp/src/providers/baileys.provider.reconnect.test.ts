import { describe, expect, it, vi } from 'vitest'
import { BaileysWhatsappProvider, type BaileysSocketEvents } from './baileys.provider'

describe('BaileysWhatsappProvider reconnect (RC-07)', () => {
  it('teardowns previous socket before creating a new one on reconnect', async () => {
    const endCalls: number[] = []
    let factoryCalls = 0
    let connectionHandler: ((update: { connection?: string; lastDisconnect?: unknown }) => void) | undefined

    const provider = new BaileysWhatsappProvider({
      socketFactory: async ({ onConnectionUpdate }) => {
        factoryCalls += 1
        connectionHandler = onConnectionUpdate
        return createMockSocket(endCalls)
      },
    })

    await provider.connect()
    expect(factoryCalls).toBe(1)

    connectionHandler?.({
      connection: 'close',
      lastDisconnect: { error: { output: { statusCode: 440 }, message: 'conflict' } },
    })
    await new Promise((resolve) => setTimeout(resolve, 50))

    await provider.connect()
    expect(endCalls.length).toBeGreaterThanOrEqual(1)
    expect(factoryCalls).toBe(2)
  })

  it('does not auto-reconnect on statusCode 440 conflict', async () => {
    let factoryCalls = 0
    const provider = new BaileysWhatsappProvider({
      socketFactory: async ({ onConnectionUpdate }) => {
        factoryCalls += 1
        onConnectionUpdate({
          connection: 'close',
          lastDisconnect: { error: { output: { statusCode: 440 }, message: 'conflict' } },
        })
        return createMockSocket([])
      },
    })

    await provider.connect()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(factoryCalls).toBe(1)
    expect(provider.getStatus().operationalMessage).toContain('Conflito')
  })

  it('deduplicates concurrent connect calls', async () => {
    let factoryCalls = 0
    const provider = new BaileysWhatsappProvider({
      socketFactory: async () => {
        factoryCalls += 1
        await new Promise((resolve) => setTimeout(resolve, 30))
        return createMockSocket([])
      },
    })

    await Promise.all([provider.connect(), provider.connect(), provider.connect()])
    expect(factoryCalls).toBe(1)
  })

  it('ignores connection updates from a stale socket instance', async () => {
    let staleHandler: ((update: { connection?: string }) => void) | undefined
    let activeHandler: ((update: { connection?: string }) => void) | undefined
    let factoryCalls = 0

    const provider = new BaileysWhatsappProvider({
      socketFactory: async ({ onConnectionUpdate }) => {
        factoryCalls += 1
        if (factoryCalls === 1) {
          staleHandler = onConnectionUpdate
        } else {
          activeHandler = onConnectionUpdate
        }
        return createMockSocket([])
      },
      qrDataUrlGenerator: async () => 'data:image/png;base64,test',
    })

    await provider.connect()
    staleHandler?.({ connection: 'close' })

    await provider.connect()
    activeHandler?.({ connection: 'open' })

    expect(provider.getStatus().status).toBe('connected')
  })
})

function createMockSocket(endCalls: number[]): BaileysSocketEvents {
  return {
    ev: {
      on: vi.fn(),
      removeAllListeners: vi.fn(),
    },
    end: vi.fn(() => {
      endCalls.push(Date.now())
    }),
  }
}
