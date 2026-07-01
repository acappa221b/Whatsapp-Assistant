import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc25Harness: Harness = {
  name: 'Rc25Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-25-chat-sort-dashboard-audio-multi-message/README.md',
      'docs/prompts/2026-06-30-rc-25-chat-sort-dashboard-audio-multi.md',
      'docs/releases/rc-25-chat-sort-dashboard-audio-multi.md',
      'apps/dashboard/src/app/dashboard/multi-mensagem/page.tsx',
      'apps/dashboard/src/app/api/whatsapp/broadcast/route.ts',
      'packages/core/src/domains/whatsapp-message/application/broadcast-whatsapp-message.use-case.ts',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const archiveView = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/messages/message-archive-view.tsx'),
      'utf-8',
    )
    if (archiveView.includes('a.displayNumber - b.displayNumber')) {
      errors.push('message-archive-view must not sort by displayNumber')
    }
    if (!archiveView.includes('lastMessageAt')) {
      errors.push('message-archive-view must sort by lastMessageAt')
    }

    const dashboardView = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/dashboard/dashboard-analytics-view.tsx'),
      'utf-8',
    )
    if (!dashboardView.includes('formatBrl4')) {
      errors.push('dashboard-analytics-view must format tooltip cost with 4 decimals')
    }
    if (!dashboardView.includes('assistant_chat')) {
      errors.push('dashboard must include assistant_chat charts and filter')
    }

    const schema = readFileSync(join(ROOT, 'packages/database/prisma/schema.prisma'), 'utf-8')
    if (!schema.includes('assistant_chat')) {
      errors.push('schema.prisma must include assistant_chat in ApiUsageCategory')
    }

    const mediaFormat = readFileSync(
      join(ROOT, 'packages/shared/src/utils/media-content-format.ts'),
      'utf-8',
    )
    if (!mediaFormat.includes('AUDIO_PENDING_CONTENT')) {
      errors.push('media-content-format must define AUDIO_PENDING_CONTENT')
    }

    const messagesRoute = readFileSync(
      join(ROOT, 'apps/dashboard/src/app/api/whatsapp/messages/route.ts'),
      'utf-8',
    )
    if (!messagesRoute.includes('shouldHideInboundAudioUntilTranscribed')) {
      errors.push('messages API must hide pending inbound audio')
    }

    const sidebar = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/layout/app-sidebar.tsx'),
      'utf-8',
    )
    if (!sidebar.includes('/dashboard/multi-mensagem')) {
      errors.push('sidebar must link to Multi Mensagem')
    }

    const assistantService = readFileSync(
      join(ROOT, 'apps/dashboard/src/lib/assistant/assistant-service.ts'),
      'utf-8',
    )
    if (!assistantService.includes("category: 'assistant_chat'")) {
      errors.push('assistant-service must record assistant_chat token usage')
    }

    const version = readFileSync(join(ROOT, 'version.json'), 'utf-8')
    if (!version.includes('1.7.') && !version.includes('rc25')) {
      errors.push('version.json must be 1.7.x (RC-25 or newer)')
    }

    return createResult(this.name, errors)
  },
}

export const Rc25Harnesses = [Rc25Harness]
