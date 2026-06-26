import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc10SpecHarness: Harness = {
  name: 'Rc10SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-10-agent-chat/README.md',
      'specs/rc-10-agent-chat/acceptance-criteria.md',
      'specs/rc-10-agent-chat/test-matrix.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const DisplayNumberSchemaHarness: Harness = {
  name: 'DisplayNumberSchemaHarness',
  async run() {
    const errors: string[] = []
    const schema = read('packages/database/prisma/schema.prisma')
    if (!schema.includes('displayNumber')) {
      errors.push('schema.prisma must include displayNumber on WhatsappChatConfig')
    }
    if (!schema.includes('agentPaused')) {
      errors.push('schema.prisma must include agentPaused on WhatsappChatConfig')
    }
    const migrationDir = join(
      ROOT,
      'packages/database/prisma/migrations/20260626140000_0009_rc10_display_number_agent',
    )
    if (!existsSync(migrationDir)) {
      errors.push('Missing rc10 display_number_agent migration')
    }
    return createResult(this.name, errors)
  },
}

export const AgentChatProviderHarness: Harness = {
  name: 'AgentChatProviderHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/ai/src/providers/openai-chat.provider.ts'))) {
      errors.push('Missing OpenAIChatProvider')
    }
    const provider = read('packages/whatsapp/src/providers/baileys.provider.ts')
    if (provider.includes('not implemented')) {
      errors.push('BaileysWhatsappProvider.sendMessage still not implemented')
    }
    const format = read('packages/shared/src/utils/agent-message-format.ts')
    if (!format.includes('return innerText.trim()')) {
      errors.push('formatAgentOutbound must return plain trimmed text')
    }
    return createResult(this.name, errors)
  },
}

export const AgentAutoReplyPipelineHarness: Harness = {
  name: 'AgentAutoReplyPipelineHarness',
  async run() {
    const errors: string[] = []
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')
    if (!runtime.includes('AgentAutoReplyPipeline')) {
      errors.push('runtime must register AgentAutoReplyPipeline')
    }
    const permissions = read('apps/dashboard/src/components/permissions/chat-permissions-view.tsx')
    if (!permissions.includes('Resposta IA')) {
      errors.push('Permissions UI must include Resposta IA column')
    }
    if (!permissions.includes('agentChatEnabled')) {
      errors.push('Permissions UI must patch agentChatEnabled')
    }
    return createResult(this.name, errors)
  },
}

export const Rc10Harnesses = [
  Rc10SpecHarness,
  DisplayNumberSchemaHarness,
  AgentChatProviderHarness,
  AgentAutoReplyPipelineHarness,
]
