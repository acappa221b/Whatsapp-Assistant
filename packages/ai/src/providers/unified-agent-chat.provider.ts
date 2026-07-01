import { z } from 'zod'
import { createUnifiedProvider, type ProviderCredentials } from './factory'
import type {
  AgentChatProvider,
  AgentReplyInput,
  AgentReplyOutput,
} from './openai-chat.provider'
import { LEGACY_SYSTEM_PROMPT, type TokenUsageCallback } from './openai-chat.provider'

const AgentReplySchema = z.object({
  action: z.enum(['reply', 'skip', 'defer']),
  reply: z.string().optional(),
  deferralPhrase: z.string().optional(),
  skipReason: z.string().optional(),
})

function buildUserPrompt(input: AgentReplyInput): string {
  const styleBlock =
    input.ownerStyleSamples.length > 0
      ? `Exemplos de mensagens do dono:\n${input.ownerStyleSamples.map((s) => `- ${s}`).join('\n')}`
      : 'Sem histórico do dono — use tom casual brasileiro.'

  const contextBlock =
    input.recentContext.length > 0
      ? `Contexto recente:\n${input.recentContext.map((m) => `${m.role}: ${m.content}`).join('\n')}`
      : 'Sem contexto recente.'

  return [
    styleBlock,
    contextBlock,
    `Mensagem recebida: ${input.incomingMessage}`,
    input.gatesPassed
      ? 'Gates pre-LLM passaram. OBRIGATORIO action=reply salvo impossibilidade real de responder.'
      : null,
    '',
    'Responda APENAS com JSON válido no formato:',
    '{"action":"reply|skip|defer","reply":"texto","deferralPhrase":"opcional","skipReason":"opcional"}',
  ]
    .filter((line) => line !== null)
    .join('\n')
}

function parseAgentReplyJson(text: string): z.infer<typeof AgentReplySchema> {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const raw = jsonMatch ? jsonMatch[0] : trimmed
  return AgentReplySchema.parse(JSON.parse(raw))
}

export class UnifiedAgentChatProvider implements AgentChatProvider {
  private readonly creds: ProviderCredentials
  private readonly onTokenUsage?: TokenUsageCallback

  constructor(creds: ProviderCredentials, onTokenUsage?: TokenUsageCallback) {
    this.creds = creds
    this.onTokenUsage = onTokenUsage
  }

  async generateReply(input: AgentReplyInput): Promise<AgentReplyOutput> {
    const provider = createUnifiedProvider(this.creds)
    const result = await provider.chatCompletion({
      system: input.systemPrompt ?? LEGACY_SYSTEM_PROMPT,
      user: buildUserPrompt(input),
      history: input.recentContext,
    })

    if (this.onTokenUsage) {
      await this.onTokenUsage({
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        model: result.model,
        chatId: input.chatId,
        messageId: input.triggerMessageId,
      })
    }

    const parsed = parseAgentReplyJson(result.text)
    const action = parsed.action
    const replyText = parsed.reply?.trim() ?? ''
    const shouldDefer = action === 'defer'

    return {
      action,
      replyText,
      shouldDefer,
      deferralPhrase: parsed.deferralPhrase,
      skipReason: parsed.skipReason,
    }
  }
}
