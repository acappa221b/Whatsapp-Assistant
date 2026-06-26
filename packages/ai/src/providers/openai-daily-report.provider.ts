import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { config } from '@finance-ai/shared/config'

export type DailyReportBullet = {
  time: string
  text: string
  resolvedAt?: string
  participants?: string[]
}

const DailyReportSchema = z.object({
  content: z.string(),
  bullets: z.array(
    z.object({
      time: z.string(),
      text: z.string(),
      resolvedAt: z.string().optional(),
      participants: z.array(z.string()).optional(),
    }),
  ),
})

const SYSTEM_PROMPT = [
  'Gere um resumo MUITO conciso em tópicos (bullet points) dos fatos do dia.',
  'Formato de cada linha:',
  '- Nome fez/disse X (HH:MM) [opcional: status concluído (HH:MM)]',
  'Máximo 15 bullets. Só fatos relevantes. Português BR.',
  'Retorne JSON com content (markdown bullet list) e bullets (array estruturado).',
].join('\n')

export class OpenAIDailyReportProvider {
  private readonly client: OpenAI
  private readonly model: string

  constructor(options: { client?: OpenAI; model?: string; apiKey?: string } = {}) {
    const apiKey =
      options.apiKey ??
      (config.openai.apiKey ||
        (typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY : ''))
    this.client =
      options.client ??
      new OpenAI({
        apiKey,
        timeout: config.openai.timeoutMs,
        maxRetries: config.openai.retryAttempts,
      })
    this.model = options.model ?? config.openai.model
  }

  async generate(input: { chatId: string; reportDate: Date; transcript: string }) {
    const responseFormat = zodResponseFormat(DailyReportSchema, 'daily_report')
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Chat: ${input.chatId}\nData: ${input.reportDate.toISOString().slice(0, 10)}\n\nTranscript:\n${input.transcript}`,
        },
      ],
      response_format: responseFormat,
    })

    const parsed = completion.choices[0]?.message?.parsed
    if (!parsed) {
      throw new Error('OpenAI daily report parse returned empty payload')
    }

    return {
      content: parsed.content.trim(),
      bullets: parsed.bullets as DailyReportBullet[],
      tokensInput: completion.usage?.prompt_tokens ?? 0,
      tokensOutput: completion.usage?.completion_tokens ?? 0,
    }
  }
}
