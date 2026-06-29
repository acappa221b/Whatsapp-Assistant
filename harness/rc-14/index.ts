import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc14SpecHarness: Harness = {
  name: 'Rc14SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-14-oss-zero-config-messages-ui/README.md',
      'docs/adr/015-zero-env-user-data-config.md',
      'docs/prompts/2025-06-26-rc-14-oss-zero-config.md',
      'docs/releases/rc-14-oss-zero-config.md',
      'LICENSE',
      'CONTRIBUTING.md',
      'scripts/launch.mjs',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    if (existsSync(join(ROOT, '.env.example'))) errors.push('.env.example must be deleted')
    return createResult(this.name, errors)
  },
}

export const Rc14MessagesHarness: Harness = {
  name: 'Rc14MessagesHarness',
  async run() {
    const errors: string[] = []
    const view = read('apps/dashboard/src/components/messages/message-archive-view.tsx')
    if (!view.includes('wa-scroll') || !view.includes('messagesEndRef')) {
      errors.push('MessageArchiveView must implement WhatsApp scroll + bubbles')
    }
    if (!view.includes('/send')) {
      errors.push('MessageArchiveView must use send API')
    }
    const layout = read('apps/dashboard/src/app/dashboard/layout.tsx')
    if (!layout.includes('h-screen') || !layout.includes('overflow-hidden')) {
      errors.push('Dashboard layout must be viewport-locked')
    }
    if (!existsSync(join(ROOT, 'apps/dashboard/src/app/api/whatsapp/chats/[chatId]/send/route.ts'))) {
      errors.push('Missing POST send route')
    }
  if (!existsSync(join(ROOT, 'apps/dashboard/src/lib/bootstrap/app-settings.ts'))) {
      errors.push('Missing app-settings bootstrap')
    }
    return createResult(this.name, errors)
  },
}

export const Rc14Harnesses = [Rc14SpecHarness, Rc14MessagesHarness]
