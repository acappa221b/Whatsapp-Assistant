import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const PROCESSORS = join(
  ROOT,
  'packages/core/src/domains/message-processing/infrastructure/processors/stub-processors.ts',
)
const RESOLVER = join(
  ROOT,
  'packages/core/src/domains/message-processing/infrastructure/default-processor-resolver.ts',
)
const CLASSIFIER = join(
  ROOT,
  'packages/core/src/domains/message-processing/infrastructure/message-type-classifier.ts',
)

const REQUIRED_PROCESSORS = [
  'TextMessageProcessor',
  'ImageMessageProcessor',
  'DocumentMessageProcessor',
  'AudioMessageProcessor',
  'UnknownMessageProcessor',
]

export const ProcessorHarness: Harness = {
  name: 'ProcessorHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(PROCESSORS)) {
      errors.push('Missing stub processors file')
      return createResult(this.name, errors)
    }

    const content = readFileSync(PROCESSORS, 'utf-8')
    for (const processor of REQUIRED_PROCESSORS) {
      if (!content.includes(processor)) {
        errors.push(`Missing processor: ${processor}`)
      }
    }

    if (!content.includes('TextMessageProcessor')) {
      errors.push('Missing TextMessageProcessor implementation')
    }
    if (!content.includes('downloadImage')) {
      errors.push('ImageMessageProcessor must download image media')
    }
    if (!content.includes('downloadDocument')) {
      errors.push('DocumentMessageProcessor must download document media')
    }
    if (!content.includes('AudioMessageProcessor') || !content.includes('NOT_IMPLEMENTED')) {
      errors.push('AudioMessageProcessor must remain NOT_IMPLEMENTED')
    }

    if (!existsSync(RESOLVER)) errors.push('Missing DefaultProcessorResolver')
    if (!existsSync(CLASSIFIER)) errors.push('Missing MessageTypeClassifier')

    return createResult(this.name, errors)
  },
}
