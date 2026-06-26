import { describe, expect, it } from 'vitest'
import {
  computeReconnectDelayMs,
  NO_RECONNECT_STATUS_CODES,
  shouldAutoReconnect,
} from './baileys-reconnect.ts'

describe('baileys-reconnect (RC-07)', () => {
  it('blacklists conflict and auth status codes', () => {
    expect(NO_RECONNECT_STATUS_CODES.has(440)).toBe(true)
    expect(NO_RECONNECT_STATUS_CODES.has(401)).toBe(true)
    expect(NO_RECONNECT_STATUS_CODES.has(403)).toBe(true)
  })

  it('shouldAutoReconnect returns false for 440', () => {
    expect(
      shouldAutoReconnect({
        autoReconnectEnabled: true,
        allowReconnect: true,
        statusCode: 440,
        disconnectMessage: 'conflict',
      }),
    ).toBe(false)
  })

  it('computeReconnectDelayMs grows with attempt', () => {
    const d0 = computeReconnectDelayMs(5000, 0)
    const d2 = computeReconnectDelayMs(5000, 2)
    expect(d2).toBeGreaterThanOrEqual(d0)
    expect(d2).toBeLessThanOrEqual(60_100)
  })
})
