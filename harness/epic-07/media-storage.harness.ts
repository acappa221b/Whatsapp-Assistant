import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const DOWNLOADER = join(ROOT, 'packages/whatsapp/src/media/media-downloader.ts')

export const MediaStorageHarness: Harness = {
  name: 'MediaStorageHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(DOWNLOADER)) {
      errors.push('Missing MediaDownloader')
      return createResult(this.name, errors)
    }

    const content = readFileSync(DOWNLOADER, 'utf-8')
    for (const required of ['downloadImage', 'downloadDocument', 'saveMedia', 'generateStoragePath']) {
      if (!content.includes(required)) {
        errors.push(`MediaDownloader missing: ${required}`)
      }
    }

    return createResult(this.name, errors)
  },
}
