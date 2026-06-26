import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { config } from '@finance-ai/shared/config'
import type {
  AIExtractionProvider,
  AIExtractionResultInput,
  MediaExtractionInput,
  TextExtractionInput,
} from './ai-extraction.provider'
import {
  ExtractionResultSchema,
  type ExtractionResult,
} from '../schemas/extraction-result.schema'

type OpenAIParseClient = {
  beta: {
    chat: {
      completions: {
        parse: (input: {
          model: string
          messages: Array<{
            role: 'system' | 'user'
            content:
              | string
              | Array<
                  | { type: 'text'; text: string }
                  | { type: 'image_url'; image_url: { url: string } }
                >
          }>
          response_format: unknown
        }) => Promise<{
          choices: Array<{ message: { parsed?: ExtractionResult | null } }>
          usage?: { prompt_tokens?: number; completion_tokens?: number }
        }>
      }
    }
  }
}

const EXTRACTION_SYSTEM_PROMPT = [
  'You classify a single WhatsApp message into structured financial candidates.',
  'Never return free text outside the schema.',
  'Only produce EXPENSE_CANDIDATE, REVENUE_CANDIDATE, or UNKNOWN.',
  'Do not create financial entities, only candidates.',
  'If uncertain, return UNKNOWN with a reason.',
  'For EXPENSE_CANDIDATE use categorySuggestion/supplierSuggestion when known, otherwise null.',
  'For REVENUE_CANDIDATE keep categorySuggestion and supplierSuggestion as null.',
  'For UNKNOWN return amount as 0, description as "UNKNOWN", confidence as 0, and fill reason.',
  'sourceType must match the input modality.',
].join(' ')

function logOpenAIStructuredOutputDebug(
  operation: 'extractText' | 'extractVision',
  model: string,
  responseFormat: unknown,
): void {
  console.log('[OpenAI/Schema-Debug] operation:', operation)
  console.log('[OpenAI/Schema-Debug] model:', model)
  console.log(
    '[OpenAI/Schema-Debug] response_format:',
    JSON.stringify(responseFormat, null, 2),
  )
}

export class OpenAIExtractionProvider implements AIExtractionProvider {
  private readonly client: OpenAIParseClient
  private readonly model: string

  constructor(options: { client?: OpenAIParseClient; model?: string; apiKey?: string } = {}) {
    const apiKey =
      options.apiKey ??
      (config.openai.apiKey ||
        (typeof process.env.OPENAI_API_KEY === 'string' ? process.env.OPENAI_API_KEY : ''))

    this.client =
      options.client ??
      (new OpenAI({
        apiKey,
        maxRetries: config.openai.retryAttempts,
        timeout: config.openai.timeoutMs,
      }) as unknown as OpenAIParseClient)
    this.model = options.model ?? config.openai.model
  }

  async extractText(input: TextExtractionInput): Promise<AIExtractionResultInput> {
    const startedAt = Date.now()
    const responseFormat = zodResponseFormat(ExtractionResultSchema, 'extraction_result')
    logOpenAIStructuredOutputDebug('extractText', this.model, responseFormat)
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            `messageId: ${input.messageId}`,
            'sourceType: TEXT',
            'message:',
            input.text,
          ].join('\n'),
        },
      ],
      response_format: responseFormat,
    })

    return this.normalizeResult(completion, {
      sourceType: 'TEXT',
      processingTimeMs: Date.now() - startedAt,
      storagePath: null,
    })
  }

  async extractImage(input: MediaExtractionInput): Promise<AIExtractionResultInput> {
    return this.extractVision(input, 'IMAGE')
  }

  async extractDocument(input: MediaExtractionInput): Promise<AIExtractionResultInput> {
    return this.extractVision(input, 'DOCUMENT')
  }

  async extractAudio(_input: MediaExtractionInput): Promise<AIExtractionResultInput> {
    throw new Error('NOT_IMPLEMENTED')
  }

  private async extractVision(
    input: MediaExtractionInput,
    sourceType: 'IMAGE' | 'DOCUMENT',
  ): Promise<AIExtractionResultInput> {
    if (!input.storagePath) {
      throw new Error(`${sourceType} extraction requires storagePath`)
    }

    const startedAt = Date.now()
    const dataUrl = await this.readMediaAsDataUrl(input.storagePath, input.mimeType)
    const responseFormat = zodResponseFormat(ExtractionResultSchema, 'extraction_result')
    logOpenAIStructuredOutputDebug('extractVision', this.model, responseFormat)
    const completion = await this.client.beta.chat.completions.parse({
      model: this.model,
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                `messageId: ${input.messageId}`,
                `sourceType: ${sourceType}`,
                `mimeType: ${input.mimeType ?? 'unknown'}`,
                `fileName: ${input.fileName ?? 'unknown'}`,
                'caption_or_context:',
                input.content || '(empty)',
              ].join('\n'),
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      response_format: responseFormat,
    })

    return this.normalizeResult(completion, {
      sourceType,
      processingTimeMs: Date.now() - startedAt,
      storagePath: input.storagePath,
    })
  }

  private normalizeResult(
    completion: Awaited<ReturnType<OpenAIParseClient['beta']['chat']['completions']['parse']>>,
    metadata: {
      sourceType: AIExtractionResultInput['sourceType']
      processingTimeMs: number
      storagePath: string | null
    },
  ): AIExtractionResultInput {
    const parsed = completion.choices[0]?.message.parsed
    if (!parsed) {
      throw new Error('OpenAIExtractionProvider returned empty structured output')
    }

    return {
      ...parsed,
      sourceType: metadata.sourceType,
      processingTimeMs: metadata.processingTimeMs,
      tokensInput: completion.usage?.prompt_tokens ?? null,
      tokensOutput: completion.usage?.completion_tokens ?? null,
      storagePath: metadata.storagePath,
      model: parsed.model || this.model,
    }
  }

  private async readMediaAsDataUrl(storagePath: string, mimeType?: string | null): Promise<string> {
    const absolutePath = resolve(process.cwd(), config.storage.mediaPath, storagePath)
    const buffer = await readFile(absolutePath)
    const normalizedMimeType = mimeType ?? 'application/octet-stream'
    return `data:${normalizedMimeType};base64,${buffer.toString('base64')}`
  }
}
