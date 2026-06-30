import { describe, expect, it, vi } from 'vitest'
import { attachGroupDiscoveryListeners, shouldDiscoverChat } from './group-discovery'
import { DEFAULT_WHATSAPP_DISCOVERY_POLICY } from '@finance-ai/shared'

describe('group-discovery policy (RC-22A)', () => {
  it('shouldDiscoverChat returns false for groups by default', () => {
    expect(shouldDiscoverChat('120363@g.us', DEFAULT_WHATSAPP_DISCOVERY_POLICY)).toBe(false)
    expect(
      shouldDiscoverChat('120363@g.us', {
        ...DEFAULT_WHATSAPP_DISCOVERY_POLICY,
        syncGroupsEnabled: true,
      }),
    ).toBe(true)
  })

  it('does not call onChatDiscovered for groups when syncGroupsEnabled=false', () => {
    const onChatDiscovered = vi.fn()
    const listeners = new Map<string, (...args: unknown[]) => void>()
    attachGroupDiscoveryListeners(
      {
        ev: {
          on(event, listener) {
            listeners.set(event, listener)
          },
        },
      },
      {
        onChatDiscovered,
        discoveryPolicy: DEFAULT_WHATSAPP_DISCOVERY_POLICY,
      },
    )
    listeners.get('groups.upsert')?.([{ subject: 'Cidade', id: '120363999@g.us' }])
    expect(onChatDiscovered).not.toHaveBeenCalled()
  })
})
