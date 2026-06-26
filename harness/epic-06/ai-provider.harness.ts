import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const PROVIDER = join(ROOT, 'packages/ai/src/providers/openai-extraction.provider.ts')
const MOCK_PROVIDER = join(ROOT, 'packages/ai/src/providers/mock-ai-extraction.provider.ts')

export const AIProviderHarness: Harness = {
  name: 'AIProviderHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(PROVIDER)) {
      errors.push('Missing OpenAIExtractionProvider')
      return createResult(this.name, errors)
    }

    const provider = readFileSync(PROVIDER, 'utf-8')
    if (!provider.includes('zodResponseFormat')) {
      errors.push('OpenAIExtractionProvider must use Structured Outputs')
    }
    if (!provider.includes('extractText')) {
      errors.push('OpenAIExtractionProvider must implement extractText')
    }
    if (!provider.includes('extractImage')) {
      errors.push('OpenAIExtractionProvider must implement extractImage')
    }
    if (!provider.includes('extractDocument')) {
      errors.push('OpenAIExtractionProvider must implement extractDocument')
    }
    if (!provider.includes('extractAudio')) {
      errors.push('OpenAIExtractionProvider must expose extractAudio')
    }
    if (!provider.includes('storagePath')) {
      errors.push('OpenAIExtractionProvider must persist multimodal metadata')
    }

    if (!existsSync(MOCK_PROVIDER)) {
      errors.push('Missing MockAIExtractionProvider')
    }

    return createResult(this.name, errors)
  },
}
