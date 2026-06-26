/**
 * RC-09 — reproduz erro 400 de schema sem alterar o provider.
 * Uso: pnpm exec tsx harness/rc-09/openai-schema-repro.ts
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { ExtractionResultSchema } from '../../packages/ai/src/schemas/extraction-result.schema.ts'

function loadRootEnv(): void {
  const envPath = resolve(import.meta.dirname, '../../.env')
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (!match) continue
    const key = match[1].trim()
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadRootEnv()

const model = process.env.OPENAI_MODEL ?? 'gpt-5-mini'
const response_format = zodResponseFormat(ExtractionResultSchema, 'extraction_result')

console.log('[rc-09/repro] model:', model)
console.log('[rc-09/repro] response_format:', JSON.stringify(response_format, null, 2))

async function main(): Promise<void> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 15_000,
    maxRetries: 0,
  })

  try {
    await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'balas 4 reais' }],
      response_format,
    })
    console.log('[rc-09/repro] SUCCESS — schema aceito pela API')
  } catch (error) {
    const err = error as {
      status?: number
      message?: string
      error?: { message?: string; type?: string; param?: string; code?: string }
    }
    console.log('[rc-09/repro] STATUS:', err.status ?? 'unknown')
    console.log('[rc-09/repro] MESSAGE:', err.message)
    if (err.error) {
      console.log('[rc-09/repro] ERROR_BODY:', JSON.stringify(err.error, null, 2))
    }
  }
}

void main()
