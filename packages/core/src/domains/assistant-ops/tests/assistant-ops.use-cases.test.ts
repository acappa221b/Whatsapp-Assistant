import { describe, expect, it } from 'vitest'
import { heuristicParse } from '../application/parse-assistant-command.use-case'
import { ResolveAssistantTargetsUseCase } from '../application/resolve-assistant-targets.use-case'

describe('heuristicParse', () => {
  it('parses send Oi to named contact', () => {
    const cmd = heuristicParse('envia um Oi para a Maiara minha esposa')
    expect(cmd.action).toBe('send_message')
    if (cmd.action !== 'send_message') return
    expect(cmd.messageText?.toLowerCase()).toBe('oi')
    expect(cmd.targets[0]).toEqual({ type: 'by_names', nameQueries: ['Maiara minha esposa'] })
  })

  it('parses birthday invite broadcast', () => {
    const cmd = heuristicParse('enviar um convite do meu aniversário para todos os chats habilitados')
    expect(cmd.action).toBe('send_message')
    if (cmd.action !== 'send_message') return
    expect(cmd.composeInstruction).toBeTruthy()
    expect(cmd.targets[0]).toEqual({ type: 'all_archive_enabled' })
  })

  it('parses message history query', () => {
    const cmd = heuristicParse('O que a Maiara falou essa semana?')
    expect(cmd.action).toBe('query')
    if (cmd.action !== 'query') return
    expect(cmd.sources).toContain('messages')
  })
})

describe('ResolveAssistantTargetsUseCase', () => {
  const chats = [
    {
      chatId: '1@lid',
      displayNumber: 12,
      name: 'Maiara',
      archiveEnabled: true,
      agentChatEnabled: true,
    },
    {
      chatId: '2@lid',
      displayNumber: 13,
      name: 'Maria',
      archiveEnabled: true,
      agentChatEnabled: false,
    },
    {
      chatId: '3@lid',
      displayNumber: 14,
      name: 'João',
      archiveEnabled: false,
      agentChatEnabled: false,
    },
  ]

  it('resolves unique name match', () => {
    const resolver = new ResolveAssistantTargetsUseCase(chats)
    const result = resolver.execute([{ type: 'by_names', nameQueries: ['Maiara'] }])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.targets).toHaveLength(1)
    expect(result.targets[0]?.chatId).toBe('1@lid')
  })

  it('clarifies ambiguous names', () => {
    const resolver = new ResolveAssistantTargetsUseCase([
      { chatId: '4@lid', displayNumber: 15, name: 'Maria', archiveEnabled: true, agentChatEnabled: true },
      { chatId: '5@lid', displayNumber: 16, name: 'Mari', archiveEnabled: true, agentChatEnabled: true },
    ])
    const result = resolver.execute([{ type: 'by_names', nameQueries: ['Mar'] }])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.clarify.toLowerCase()).toContain('mais de um')
  })

  it('blocks disabled chat', () => {
    const resolver = new ResolveAssistantTargetsUseCase(chats)
    const result = resolver.execute([{ type: 'by_names', nameQueries: ['João'] }])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.clarify).toContain('habilitado')
  })
})
