import OpenAI from 'openai'
import { createReadStream } from 'node:fs'
import { readFile } from 'node:fs/promises'

export type AiCapability = 'chat' | 'transcription' | 'vision' | 'report' | 'assistant'

export type UnifiedAiResult = {
  text: string
  tokensInput: number
  tokensOutput: number
  model: string
}

export type UnifiedAiProvider = {
  chatCompletion(input: {
    system: string
    user: string
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }): Promise<UnifiedAiResult>
  transcribeAudio(filePath: string): Promise<UnifiedAiResult & { text: string }>
  describeImage(filePath: string, prompt?: string): Promise<UnifiedAiResult>
}

export type ProviderCredentials = {
  provider: 'openai' | 'gemini' | 'deepseek' | 'custom'
  apiKey: string
  model?: string | null
  baseUrl?: string | null
}

export class OpenAiUnifiedProvider implements UnifiedAiProvider {
  constructor(private readonly creds: ProviderCredentials) {}

  private get client() {
    return new OpenAI({
      apiKey: this.creds.apiKey,
      baseURL: this.creds.baseUrl ?? undefined,
    })
  }

  private get model() {
    return this.creds.model?.trim() || 'gpt-4o-mini'
  }

  async chatCompletion(input: {
    system: string
    user: string
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }): Promise<UnifiedAiResult> {
    const client = this.client
    const messages = [
      { role: 'system' as const, content: input.system },
      ...(input.history ?? []).map((entry) => ({ role: entry.role, content: entry.content })),
      { role: 'user' as const, content: input.user },
    ]
    const completion = await client.chat.completions.create({ model: this.model, messages })
    return {
      text: completion.choices[0]?.message?.content?.trim() ?? '',
      tokensInput: completion.usage?.prompt_tokens ?? 0,
      tokensOutput: completion.usage?.completion_tokens ?? 0,
      model: this.model,
    }
  }

  async transcribeAudio(filePath: string) {
    const client = this.client
    const transcription = await client.audio.transcriptions.create({
      file: createReadStream(filePath),
      model: this.creds.model?.trim() || 'whisper-1',
    })
    const text = typeof transcription.text === 'string' ? transcription.text : ''
    return { text, tokensInput: 0, tokensOutput: 0, model: 'whisper-1' }
  }

  async describeImage(filePath: string, prompt?: string) {
    const client = this.client
    const buffer = await readFile(filePath)
    const base64 = buffer.toString('base64')
    const completion = await client.chat.completions.create({
      model: this.creds.model?.trim() || 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt ?? 'Descreva a imagem brevemente em português.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
          ],
        },
      ],
    })
    return {
      text: completion.choices[0]?.message?.content?.trim() ?? '',
      tokensInput: completion.usage?.prompt_tokens ?? 0,
      tokensOutput: completion.usage?.completion_tokens ?? 0,
      model: this.creds.model?.trim() || 'gpt-4o-mini',
    }
  }
}

export class DeepseekUnifiedProvider extends OpenAiUnifiedProvider {
  constructor(creds: ProviderCredentials) {
    super({
      ...creds,
      baseUrl: creds.baseUrl ?? 'https://api.deepseek.com',
      model: creds.model ?? 'deepseek-chat',
    })
  }
}

export class OpenAiCompatibleProvider extends OpenAiUnifiedProvider {}

export class GeminiUnifiedProvider implements UnifiedAiProvider {
  constructor(private readonly creds: ProviderCredentials) {}

  private get model() {
    return this.creds.model?.trim() || 'gemini-2.0-flash'
  }

  async chatCompletion(input: {
    system: string
    user: string
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }): Promise<UnifiedAiResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.creds.apiKey}`
    const parts = [
      { text: input.system },
      ...(input.history ?? []).map((h) => ({ text: `${h.role}: ${h.content}` })),
      { text: input.user },
    ]
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] }),
    })
    if (!response.ok) throw new Error(`Gemini error: ${response.status}`)
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
    }
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '',
      tokensInput: data.usageMetadata?.promptTokenCount ?? 0,
      tokensOutput: data.usageMetadata?.candidatesTokenCount ?? 0,
      model: this.model,
    }
  }

  async transcribeAudio(_filePath: string): Promise<UnifiedAiResult & { text: string }> {
    return Promise.reject(new Error('Gemini transcription not configured — use OpenAI for Whisper'))
  }

  async describeImage(filePath: string, prompt?: string) {
    const buffer = await readFile(filePath)
    const base64 = buffer.toString('base64')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.creds.apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt ?? 'Descreva a imagem em português.' },
              { inline_data: { mime_type: 'image/jpeg', data: base64 } },
            ],
          },
        ],
      }),
    })
    if (!response.ok) throw new Error(`Gemini vision error: ${response.status}`)
    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
    }
    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '',
      tokensInput: data.usageMetadata?.promptTokenCount ?? 0,
      tokensOutput: data.usageMetadata?.candidatesTokenCount ?? 0,
      model: this.model,
    }
  }
}

export function createUnifiedProvider(creds: ProviderCredentials): UnifiedAiProvider {
  switch (creds.provider) {
    case 'gemini':
      return new GeminiUnifiedProvider(creds)
    case 'deepseek':
      return new DeepseekUnifiedProvider(creds)
    case 'custom':
      return new OpenAiCompatibleProvider(creds)
    case 'openai':
    default:
      return new OpenAiUnifiedProvider(creds)
  }
}
