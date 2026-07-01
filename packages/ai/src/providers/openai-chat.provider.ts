import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { config } from '@finance-ai/shared/config'

export type AgentReplyAction = 'reply' | 'skip' | 'defer'

export type AgentReplyInput = {
  incomingMessage: string
  chatId: string
  triggerMessageId?: string
  ownerStyleSamples: string[]
  recentContext: Array<{ role: 'user' | 'assistant'; content: string }>
  hasOwnerHistory: boolean
  systemPrompt?: string
  gatesPassed?: boolean
}

export type AgentReplyOutput = {
  action: AgentReplyAction
  replyText: string
  shouldDefer: boolean
  deferralPhrase?: string
  skipReason?: string
}

export type AgentChatProvider = {
  generateReply(input: AgentReplyInput): Promise<AgentReplyOutput>
}

const AgentReplySchema = z.object({
  action: z.enum(['reply', 'skip', 'defer']),
  reply: z.string().optional(),
  deferralPhrase: z.string().optional(),
  skipReason: z.string().optional(),
})

export const LEGACY_SYSTEM_PROMPT = [
  'Você responde mensagens de WhatsApp em nome do usuário (dono da conta).',
  'REGRAS:',
  '1. Se houver exemplos de mensagens do dono, imite tom, gírias, tamanho e estilo — não pareça robô.',
  '2. Se não houver histórico do dono, responda de forma natural, casual e breve em português brasileiro.',
  '3. Se a pergunta exigir informação que você NÃO pode saber (agenda, decisões, dados pessoais, compromissos, opiniões do dono, fatos não presentes no contexto), NÃO invente. Use action=defer com frase curta pedindo tempo, ex.: "Opa, me dá um minutinho que tô terminando um negócio aqui e já te falo".',
  '4. Nunca mencione que é IA na resposta gerada.',
  '5. Respostas curtas, estilo WhatsApp.',
  '6. NUNCA faça convites (marcar horário, "vamos nos encontrar", "pode ser às X", "te chamo depois") nem aceite convites ("combinado", "fechado", "pode ser", "tô dentro"). Se pedirem compromisso → action=defer com frase pedindo tempo.',
  '7. Use action=skip SOMENTE para reconhecimento puro sem conteudo: "boa", "kkk", "show", "legal", "blz", emoji so — mensagens curtas ja filtradas antes do LLM.',
  '8. Se voce JA respondeu no contexto recente com a mesma ideia, NAO repita. Use action=skip se a nova mensagem so atualiza status sem pergunta nova.',
  '9. Se a pessoa so informa andamento ("so um ajuste fino", "quase la") apos voce ja ter reconhecido, use action=skip.',
  '10. Saudacoes (oi, ola, tudo bem, bom dia), perguntas com ? e mensagens com varias palavras → action=reply salvo impossibilidade real.',
  '11. Quando gatesPassed=true no prompt, priorize action=reply — o sistema ja descartou ack-only e mensagens triviais.',
].join('\n')

export type TokenUsageCallback = (usage: {
  tokensInput: number
  tokensOutput: number
  model: string
  chatId?: string
  messageId?: string
}) => void | Promise<void>

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
      ? 'Gates pre-LLM passaram. OBRIGATORIO action=reply salvo impossibilidade real de responder (sem inventar fatos).'
      : null,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export class OpenAIChatProvider implements AgentChatProvider {
  private readonly client: OpenAI
  private readonly model: string
  private readonly timeoutMs: number
  private readonly retryAttempts: number
  private readonly retryDelayMs: number
  private readonly onTokenUsage?: TokenUsageCallback

  constructor(
    options: {
      client?: OpenAI
      model?: string
      apiKey?: string
      timeoutMs?: number
      retryAttempts?: number
      retryDelayMs?: number
      onTokenUsage?: TokenUsageCallback
    } = {},
  ) {
    const apiKey =
      options.apiKey ??
      (config.openai.apiKey ||
        (typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY : ''))

    this.client =
      options.client ??
      new OpenAI({
        apiKey,
        timeout: options.timeoutMs ?? config.openai.timeoutMs,
        maxRetries: options.retryAttempts ?? config.openai.retryAttempts,
      })
    this.model = options.model ?? config.openai.model
    this.timeoutMs = options.timeoutMs ?? config.openai.timeoutMs
    this.retryAttempts = options.retryAttempts ?? config.openai.retryAttempts
    this.retryDelayMs = options.retryDelayMs ?? config.openai.retryDelayMs
    this.onTokenUsage = options.onTokenUsage
  }

  async generateReply(input: AgentReplyInput): Promise<AgentReplyOutput> {
    const responseFormat = zodResponseFormat(AgentReplySchema, 'agent_reply')

    let lastError: unknown
    for (let attempt = 0; attempt <= this.retryAttempts; attempt += 1) {
      try {
        const completion = await this.client.beta.chat.completions.parse({
          model: this.model,
          messages: [
            { role: 'system', content: input.systemPrompt?.trim() || LEGACY_SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(input) },
          ],
          response_format: responseFormat,
        })

        const parsed = completion.choices[0]?.message?.parsed
        if (!parsed) {
          throw new Error('OpenAI agent reply parse returned empty payload')
        }

        const usage = completion.usage
        if (usage && this.onTokenUsage) {
          await this.onTokenUsage({
            tokensInput: usage.prompt_tokens ?? 0,
            tokensOutput: usage.completion_tokens ?? 0,
            model: this.model,
            chatId: input.chatId,
            messageId: input.triggerMessageId,
          })
        }

        if (parsed.action === 'skip') {
          return {
            action: 'skip',
            replyText: '',
            shouldDefer: false,
            skipReason: parsed.skipReason?.trim() || 'llm-skip',
          }
        }

        if (parsed.action === 'defer') {
          return {
            action: 'defer',
            replyText: '',
            shouldDefer: true,
            deferralPhrase: parsed.deferralPhrase?.trim() || undefined,
          }
        }

        const reply = parsed.reply?.trim()
        if (!reply) {
          return {
            action: 'defer',
            replyText: '',
            shouldDefer: true,
            deferralPhrase: 'Opa, me dá um minutinho que já te falo',
          }
        }

        return { action: 'reply', replyText: reply, shouldDefer: false }
      } catch (error) {
        lastError = error
        if (attempt < this.retryAttempts) {
          await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs))
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  }
}
