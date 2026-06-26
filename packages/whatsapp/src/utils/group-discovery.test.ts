import { describe, expect, it, vi } from 'vitest'
import { attachGroupDiscoveryListeners, logIncomingMessageDiscovery } from './group-discovery'

describe('group-discovery', () => {
  it('logs remoteJid and participant for discovery', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    logIncomingMessageDiscovery({
      key: {
        id: 'm1',
        remoteJid: '120363123@g.us',
        participant: '155650134945974@lid',
        fromMe: false,
      },
    })
    expect(spy).toHaveBeenCalledWith(
      '[WhatsApp/Group-Discovery] Mensagem recebida de:',
      '120363123@g.us',
      'Enviada por:',
      '155650134945974@lid',
    )
    spy.mockRestore()
  })

  it('logs Financeiro UNIQUE group id from groups.update', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const listeners = new Map<string, (...args: unknown[]) => void>()
    attachGroupDiscoveryListeners({
      ev: {
        on(event, listener) {
          listeners.set(event, listener)
        },
      },
    })
    listeners.get('groups.update')?.([
      { subject: 'Financeiro UNIQUE', id: '120363999@g.us' },
    ])
    expect(spy).toHaveBeenCalledWith(
      '[WhatsApp/Group-Discovery] groups.update — Grupo encontrado:',
      'Financeiro UNIQUE',
      'ID:',
      '120363999@g.us',
    )
    spy.mockRestore()
  })
})
