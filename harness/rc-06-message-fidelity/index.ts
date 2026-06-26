import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc06MessageFidelitySpecHarness: Harness = {
  name: 'Rc06MessageFidelitySpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-06-message-fidelity/README.md',
      'specs/rc-06-message-fidelity/acceptance-criteria.md',
      'specs/rc-06-message-fidelity/test-matrix.md',
      'specs/rc-06-message-fidelity/root-causes.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const MessageFidelityHarness: Harness = {
  name: 'MessageFidelityHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/core/src/domains/whatsapp-message/application/message-fidelity.use-case.ts'))) {
      errors.push('Missing GetMessageFidelityMetricsUseCase')
    }
    if (!read('packages/database/src/repositories/whatsapp-message.prisma-repository.ts').includes('getFidelityMetrics')) {
      errors.push('Prisma repository must implement getFidelityMetrics')
    }
    if (!existsSync(join(ROOT, 'apps/dashboard/src/app/api/whatsapp/fidelity/route.ts'))) {
      errors.push('Missing /api/whatsapp/fidelity route')
    }
    return createResult(this.name, errors)
  },
}

export const ContactResolverHarness: Harness = {
  name: 'ContactResolverHarness',
  async run() {
    const errors: string[] = []
    const resolver = read('packages/whatsapp/src/utils/chat-contact-resolver.ts')
    if (!resolver.includes('class ChatContactResolver')) {
      errors.push('Missing ChatContactResolver')
    }
    if (!resolver.includes('shouldPersistChatName')) {
      errors.push('ChatContactResolver must expose shouldPersistChatName')
    }
    if (!read('packages/whatsapp/src/utils/contact-name-resolver.ts').includes('ChatContactResolver')) {
      errors.push('ContactNameResolver must delegate to ChatContactResolver')
    }
    return createResult(this.name, errors)
  },
}

export const ImageExtractionHarness: Harness = {
  name: 'ImageExtractionHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/shared/src/utils/image-fidelity-log.ts'))) {
      errors.push('Missing image-fidelity-log')
    }
    if (!read('packages/core/src/domains/message-processing/infrastructure/processors/stub-processors.ts').includes('logImageFidelity')) {
      errors.push('Image processor must log fidelity stages')
    }
    if (!existsSync(join(ROOT, 'docs/investigations/rc-06-image-processing.md'))) {
      errors.push('Missing docs/investigations/rc-06-image-processing.md')
    }
    return createResult(this.name, errors)
  },
}

export const TextExtractionHarness: Harness = {
  name: 'TextExtractionHarness',
  async run() {
    const errors: string[] = []
    const classifier = read('packages/core/src/domains/message-archive/baileys-message-classifier.ts')
    if (!classifier.includes('templateButtonReplyMessage')) {
      errors.push('Classifier must handle templateButtonReplyMessage')
    }
    if (!existsSync(join(ROOT, 'packages/core/src/domains/message-archive/baileys-message-fidelity.test.ts'))) {
      errors.push('Missing baileys-message-fidelity.test.ts fixtures')
    }
    return createResult(this.name, errors)
  },
}

export const ChatNamingHarness: Harness = {
  name: 'ChatNamingHarness',
  async run() {
    const errors: string[] = []
    const repo = read('packages/database/src/repositories/whatsapp-message.prisma-repository.ts')
    if (!repo.includes('fromMe: false')) {
      errors.push('listChatSummaries must prefer incoming messages for chatName')
    }
    if (!read('apps/dashboard/src/lib/whatsapp/name-bootstrap.ts').includes('repairDmChatNames')) {
      errors.push('name-bootstrap must include repairDmChatNames')
    }
    if (!existsSync(join(ROOT, 'apps/dashboard/src/app/dashboard/diagnostics/page.tsx'))) {
      errors.push('Missing /dashboard/diagnostics page')
    }
    return createResult(this.name, errors)
  },
}

export const Rc06MessageFidelityHarnesses = [
  Rc06MessageFidelitySpecHarness,
  MessageFidelityHarness,
  ContactResolverHarness,
  ImageExtractionHarness,
  TextExtractionHarness,
  ChatNamingHarness,
]
