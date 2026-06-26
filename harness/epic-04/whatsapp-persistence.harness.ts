import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const SCHEMA = join(ROOT, 'packages/database/prisma/schema.prisma')
const REPO = join(ROOT, 'packages/database/src/repositories/whatsapp-message.prisma-repository.ts')
const MAPPER = join(ROOT, 'packages/database/src/mappers/whatsapp-message.mapper.ts')

export const WhatsappPersistenceHarness: Harness = {
  name: 'WhatsappPersistenceHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(REPO)) errors.push('Missing WhatsappMessagePrismaRepository')
    if (!existsSync(MAPPER)) errors.push('Missing WhatsappMessageMapper')

    if (existsSync(SCHEMA)) {
      const schema = readFileSync(SCHEMA, 'utf-8')
      for (const field of ['chatId', 'sender', 'messageType', 'mediaUrl', 'receivedAt']) {
        if (!schema.includes(field)) {
          errors.push(`WhatsappMessage schema missing field: ${field}`)
        }
      }
      if (!schema.includes('enum MessageType')) {
        errors.push('Missing MessageType enum in schema')
      }
    } else {
      errors.push('Missing Prisma schema')
    }

    if (existsSync(REPO)) {
      const content = readFileSync(REPO, 'utf-8')
      if (!content.includes('WhatsappMessageRepository')) {
        errors.push('Repository must implement WhatsappMessageRepository')
      }
    }

    return createResult(this.name, errors)
  },
}
