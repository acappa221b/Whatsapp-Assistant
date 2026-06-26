import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc07SpecHarness: Harness = {
  name: 'Rc07SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-07-baileys-stability/README.md',
      'docs/investigations/rc-07-baileys-stability-and-names.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const ReconnectFixHarness: Harness = {
  name: 'ReconnectFixHarness',
  async run() {
    const errors: string[] = []
    const provider = read('packages/whatsapp/src/providers/baileys.provider.ts')
    if (!provider.includes('connectingInFlight')) {
      errors.push('Missing connect mutex connectingInFlight')
    }
    if (!provider.includes('[RC-07/connection.update]')) {
      errors.push('Missing structured connection logs')
    }
    if (!provider.includes('NO_RECONNECT_STATUS_CODES') && !read('packages/whatsapp/src/utils/baileys-reconnect.ts').includes('440')) {
      errors.push('Missing 440 in reconnect blacklist')
    }
    if (!provider.includes('if (this.socket)')) {
      errors.push('connect must teardown when socket exists')
    }
    const reconnect = read('packages/whatsapp/src/utils/baileys-reconnect.ts')
    if (!reconnect.includes('computeReconnectDelayMs')) {
      errors.push('Missing exponential backoff helper')
    }
    return createResult(this.name, errors)
  },
}

export const NameBootstrapHarness: Harness = {
  name: 'NameBootstrapHarness',
  async run() {
    const errors: string[] = []
    const bootstrap = read('apps/dashboard/src/lib/whatsapp/name-bootstrap.ts')
    if (!bootstrap.includes('bootstrapWhatsappNames')) {
      errors.push('Missing name bootstrap module')
    }
    if (!bootstrap.includes('resolveChatNames')) {
      errors.push('name bootstrap must run ResolveChatNamesUseCase (RC-09)')
    }
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')
    if (!runtime.includes('onConnectionOpen')) {
      errors.push('Runtime must wire onConnectionOpen bootstrap')
    }
    const resolver = read('packages/whatsapp/src/utils/contact-name-resolver.ts')
    if (!resolver.includes('[RC-07/groupMetadata] failed')) {
      errors.push('groupMetadata failures must be logged')
    }
    return createResult(this.name, errors)
  },
}

export const MessagePreviewHarness: Harness = {
  name: 'MessagePreviewHarness',
  async run() {
    const errors: string[] = []
    const preview = read('packages/shared/src/utils/message-preview.ts')
    if (!preview.includes('resolveMessagePreview')) {
      errors.push('Missing resolveMessagePreview')
    }
    const route = read('apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts')
    if (!route.includes('resolveMessagePreview')) {
      errors.push('archive/chats must use resolveMessagePreview')
    }
    return createResult(this.name, errors)
  },
}

export const Rc07MessageFidelitySpecHarness: Harness = {
  name: 'Rc07MessageFidelitySpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-07-message-fidelity/README.md',
      'specs/rc-07-message-fidelity/acceptance-criteria.md',
      'docs/investigations/rc-07/parser-and-wrappers.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const BaileysUnwrapperHarness: Harness = {
  name: 'BaileysUnwrapperHarness',
  async run() {
    const errors: string[] = []
    const unwrapper = read('packages/core/src/domains/message-archive/baileys-message-unwrapper.ts')
    if (!unwrapper.includes('unwrapBaileysMessage')) {
      errors.push('Missing unwrapBaileysMessage')
    }
    if (!unwrapper.includes('deviceSentMessage')) {
      errors.push('Unwrapper must support deviceSentMessage')
    }
    if (!unwrapper.includes('futureProofMessage')) {
      errors.push('Unwrapper must support futureProofMessage')
    }
    return createResult(this.name, errors)
  },
}

export const ChatIdentityResolverHarness: Harness = {
  name: 'ChatIdentityResolverHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/shared/src/utils/chat-identity-resolver.ts'))) {
      errors.push('Missing ChatIdentityResolver')
    }
    const chatsRoute = read('apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts')
    if (!chatsRoute.includes('getChatIdentityResolver')) {
      errors.push('archive/chats must use ChatIdentityResolver')
    }
    const messagesRoute = read('apps/dashboard/src/app/api/whatsapp/messages/route.ts')
    if (!messagesRoute.includes('getChatIdentityResolver')) {
      errors.push('messages route must use ChatIdentityResolver')
    }
    return createResult(this.name, errors)
  },
}

export const ArchiveHealthHarness: Harness = {
  name: 'ArchiveHealthHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'apps/dashboard/src/app/api/whatsapp/archive/health/route.ts'))) {
      errors.push('Missing /api/whatsapp/archive/health')
    }
    const metrics = read('packages/core/src/domains/message-archive/message-metrics.ts')
    if (!metrics.includes('buildArchiveHealthSnapshot')) {
      errors.push('Missing buildArchiveHealthSnapshot')
    }
    const capture = read('packages/whatsapp/src/metrics/capture-metrics.ts')
    if (!capture.includes('recordMessageMapped')) {
      errors.push('Missing recordMessageMapped')
    }
    return createResult(this.name, errors)
  },
}

export const RepairHistoricalHarness: Harness = {
  name: 'RepairHistoricalHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'apps/dashboard/src/lib/whatsapp/repair-historical-messages.ts'))) {
      errors.push('Missing repairHistoricalMessages')
    }
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')
    if (!runtime.includes('repairHistoricalMessages')) {
      errors.push('Runtime must call repairHistoricalMessages on connection open')
    }
    return createResult(this.name, errors)
  },
}

export const Rc07LogHarness: Harness = {
  name: 'Rc07LogHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/shared/src/utils/rc07-log.ts'))) {
      errors.push('Missing rc07-log')
    }
    const classifier = read('packages/core/src/domains/message-archive/baileys-message-classifier.ts')
    if (!classifier.includes("logRc07('WRAPPER'")) {
      errors.push('Classifier must log WRAPPER events')
    }
    return createResult(this.name, errors)
  },
}

export const Rc07Harnesses = [
  Rc07SpecHarness,
  ReconnectFixHarness,
  NameBootstrapHarness,
  MessagePreviewHarness,
  Rc07MessageFidelitySpecHarness,
  BaileysUnwrapperHarness,
  ChatIdentityResolverHarness,
  ArchiveHealthHarness,
  RepairHistoricalHarness,
  Rc07LogHarness,
]
