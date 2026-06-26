import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const RuntimeHarness: Harness = {
  name: 'RuntimeHarness',
  async run() {
    const errors: string[] = []
    const integrity = read('apps/dashboard/src/lib/whatsapp/runtime-integrity.ts')
    if (!integrity.includes('WHATSAPP_RUNTIME_VERSION')) {
      errors.push('Missing WHATSAPP_RUNTIME_VERSION')
    }
    if (!integrity.includes('listChatArchiveUseCase')) {
      errors.push('Integrity check must include listChatArchiveUseCase')
    }
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')
    if (!runtime.includes('[RUNTIME_INIT]')) {
      errors.push('Missing [RUNTIME_INIT] log')
    }
    if (!runtime.includes('[RUNTIME_REBUILD]')) {
      errors.push('Missing [RUNTIME_REBUILD] log')
    }
    if (!runtime.includes('[RUNTIME_INVALID]')) {
      errors.push('Missing [RUNTIME_INVALID] log')
    }
    if (!runtime.includes('needsRuntimeRebuild')) {
      errors.push('Missing needsRuntimeRebuild')
    }
    if (!runtime.includes('getRuntimeHealth')) {
      errors.push('Missing getRuntimeHealth export')
    }
    return createResult(this.name, errors)
  },
}

export const ArchiveApiHarness: Harness = {
  name: 'ArchiveApiHarness',
  async run() {
    const errors: string[] = []
    const route = join(ROOT, 'apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts')
    if (!existsSync(route)) {
      errors.push('Missing archive/chats route')
      return createResult(this.name, errors)
    }
    const content = read('apps/dashboard/src/app/api/whatsapp/archive/chats/route.ts')
    if (!content.includes('listChatArchiveUseCase')) {
      errors.push('Route must use listChatArchiveUseCase')
    }
    if (!content.includes('details')) {
      errors.push('Route must return error details')
    }
    if (!content.includes('RC-05/archive/chats')) {
      errors.push('Route must include RC-05 structured logging')
    }
    return createResult(this.name, errors)
  },
}

export const MessageFilterHarness: Harness = {
  name: 'MessageFilterHarness',
  async run() {
    const errors: string[] = []
    const route = read('apps/dashboard/src/app/api/whatsapp/messages/route.ts')
    if (!route.includes('chatId')) {
      errors.push('messages route must read chatId param')
    }
    if (!route.includes('RC-05/API_MESSAGES_RESPONSE')) {
      errors.push('messages route must log chatId in response')
    }
    const repo = read('packages/database/src/repositories/whatsapp-message.prisma-repository.ts')
    if (!repo.includes('filters.chatId')) {
      errors.push('repository must filter by chatId')
    }
    const filterTest = join(ROOT, 'packages/core/src/domains/whatsapp-message/tests/whatsapp-message-chat-filter.test.ts')
    if (!existsSync(filterTest)) {
      errors.push('Missing whatsapp-message-chat-filter.test.ts')
    }
    return createResult(this.name, errors)
  },
}

export const MessageUiHarness: Harness = {
  name: 'MessageUiHarness',
  async run() {
    const errors: string[] = []
    const ui = read('apps/dashboard/src/components/messages/message-archive-view.tsx')
    if (!ui.includes('Erro ao carregar chats')) {
      errors.push('UI must show chat load error message')
    }
    if (!ui.includes('Erro ao carregar mensagens')) {
      errors.push('UI must show message load error message')
    }
    if (!ui.includes('response.ok') && !ui.includes('!response.ok')) {
      errors.push('UI must check response.ok')
    }
    if (!ui.includes('userSelectedChat')) {
      errors.push('UI must preserve user chat selection on refresh')
    }
    if (!ui.includes('senderId')) {
      errors.push('UI must display senderId')
    }
    return createResult(this.name, errors)
  },
}

export const RepositoryHarness: Harness = {
  name: 'RepositoryHarness',
  async run() {
    const errors: string[] = []
    const repoTest = read('packages/database/src/repositories/whatsapp-message.prisma-repository.test.ts')
    if (!repoTest.includes('chatId filter')) {
      errors.push('Repository test must cover chatId filter')
    }
    const spec = join(ROOT, 'specs/rc-05-runtime-refresh/README.md')
    if (!existsSync(spec)) {
      errors.push('Missing specs/rc-05-runtime-refresh/README.md')
    }
    return createResult(this.name, errors)
  },
}

export const Rc05Harnesses = [
  RuntimeHarness,
  ArchiveApiHarness,
  MessageFilterHarness,
  MessageUiHarness,
  RepositoryHarness,
]
