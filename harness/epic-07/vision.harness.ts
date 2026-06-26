import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const PROVIDER = join(ROOT, 'packages/ai/src/providers/openai-extraction.provider.ts')

export const VisionHarness: Harness = {
  name: 'VisionHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(PROVIDER)) {
      errors.push('Missing OpenAIExtractionProvider')
      return createResult(this.name, errors)
    }

    const content = readFileSync(PROVIDER, 'utf-8')
    for (const required of ['extractImage', 'extractDocument', 'image_url', 'storagePath']) {
      if (!content.includes(required)) {
        errors.push(`Vision provider missing: ${required}`)
      }
    }

    return createResult(this.name, errors)
  },
}
