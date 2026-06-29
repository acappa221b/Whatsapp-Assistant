import type { AssistantCommand } from '../domain/assistant-command.types'

export type CommandParserPort = {
  parse(input: { message: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> }): Promise<AssistantCommand>
}

const SEND_KEYWORDS = /(envia|enviar|manda|mandar|dispara|disparar)/i
const ALL_KEYWORDS = /(todos|todas|habilitados|contatos|chats)/i

function heuristicParse(message: string): AssistantCommand {
  const trimmed = message.trim()
  const lower = trimmed.toLowerCase()

  if (SEND_KEYWORDS.test(trimmed)) {
    const quoted = trimmed.match(/["“](.+?)["”]/)?.[1]?.trim()
    const oiMatch = trimmed.match(/\b(oi|olá|ola)\b/i)
    const messageText = quoted ?? (oiMatch ? oiMatch[0] : null)

    const composeInstruction =
      !messageText && /(convite|aniversário|aniversario)/i.test(trimmed)
        ? trimmed
        : null

    if (ALL_KEYWORDS.test(lower)) {
      const agentOnly = /resposta\s*ia/i.test(lower)
      return {
        action: 'send_message',
        messageText: messageText ?? (composeInstruction ? null : 'Olá!'),
        composeInstruction,
        targets: [{ type: agentOnly ? 'all_agent_enabled' : 'all_archive_enabled' }],
        requiresConfirmation: true,
      }
    }

    const forMatch = trimmed.match(/(?:para|pra)\s+(?:a\s+)?(.+)$/i)
    const namePart = forMatch?.[1]?.trim()
    if (namePart) {
      const names = namePart
        .split(/\s+e\s+|\s*,\s*/i)
        .map((part) => part.replace(/^(a|o)\s+/i, '').trim())
        .filter(Boolean)
      return {
        action: 'send_message',
        messageText: messageText ?? (composeInstruction ? null : 'Olá!'),
        composeInstruction,
        targets: [{ type: 'by_names', nameQueries: names.length ? names : [namePart] }],
        requiresConfirmation: true,
      }
    }
  }

  const wantsMessages =
    /(mensagem|disse|falou|chat|ontem|semana|hoje)/i.test(trimmed) &&
    !/(relatório|relatorio)/i.test(trimmed)
  const wantsReports = /(relatório|relatorio|resumo)/i.test(trimmed)

  return {
    action: 'query',
    question: trimmed,
    sources: wantsMessages && wantsReports ? ['both'] : wantsMessages ? ['messages'] : ['reports', 'messages'],
  }
}

export class ParseAssistantCommandUseCase {
  constructor(private readonly parser?: CommandParserPort) {}

  async execute(input: {
    message: string
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }): Promise<AssistantCommand> {
    if (this.parser) {
      try {
        return await this.parser.parse(input)
      } catch {
        return heuristicParse(input.message)
      }
    }
    return heuristicParse(input.message)
  }
}

export { heuristicParse }
