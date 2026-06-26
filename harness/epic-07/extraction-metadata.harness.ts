import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const EXTRACTION_ENTITY = join(ROOT, 'packages/core/src/domains/extraction/domain/extraction.entity.ts')
const EXTRACTIONS_API = join(ROOT, 'apps/dashboard/src/app/api/extractions/route.ts')

export const ExtractionMetadataHarness: Harness = {
  name: 'ExtractionMetadataHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(EXTRACTION_ENTITY)) {
      errors.push('Missing Extraction entity')
    } else {
      const entity = readFileSync(EXTRACTION_ENTITY, 'utf-8')
      for (const required of ['sourceType', 'processingTimeMs', 'tokensInput', 'tokensOutput', 'storagePath']) {
        if (!entity.includes(required)) {
          errors.push(`Extraction metadata missing in entity: ${required}`)
        }
      }
    }

    if (!existsSync(EXTRACTIONS_API)) {
      errors.push('Missing extractions API')
    } else {
      const api = readFileSync(EXTRACTIONS_API, 'utf-8')
      for (const required of ['previewUrl', 'downloadUrl', 'processingTimeMs']) {
        if (!api.includes(required)) {
          errors.push(`Extraction metadata missing in API: ${required}`)
        }
      }
    }

    return createResult(this.name, errors)
  },
}
