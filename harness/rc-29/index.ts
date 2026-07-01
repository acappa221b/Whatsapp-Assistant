import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc29Harness: Harness = {
  name: 'Rc29Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-29-agent-auto-reply-fix/README.md',
      'docs/investigations/agent-auto-reply-not-sending.md',
      'docs/prompts/2026-07-01-rc-29-agent-auto-reply-fix.md',
      'packages/core/src/domains/agent-chat/application/agent-reply-diagnostics.ts',
      'packages/core/src/domains/agent-chat/tests/agent-auto-reply.pipeline.test.ts',
      'packages/ai/src/providers/unified-agent-chat.provider.ts',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const runtime = readFileSync(join(ROOT, 'apps/dashboard/src/lib/whatsapp/runtime.ts'), 'utf-8')
    if (!runtime.includes('registeredPipelineEventBus')) {
      errors.push('runtime must bind pipelines to registeredPipelineEventBus')
    }
    if (!runtime.includes('persistOutbound')) {
      errors.push('runtime must wire persistOutbound for agent replies')
    }

    const pipeline = readFileSync(
      join(ROOT, 'packages/core/src/domains/agent-chat/infrastructure/agent-auto-reply.pipeline.ts'),
      'utf-8',
    )
    if (!pipeline.includes('pipeline handler failed')) {
      errors.push('AgentAutoReplyPipeline must log handler failures')
    }

    const useCase = readFileSync(
      join(ROOT, 'packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts'),
      'utf-8',
    )
    if (!useCase.includes('[AgentChat] reply sent')) {
      errors.push('ProcessAgentAutoReplyUseCase must log reply sent')
    }
    if (!useCase.includes('persistOutbound')) {
      errors.push('ProcessAgentAutoReplyUseCase must support persistOutbound')
    }

    const permissions = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/permissions/chat-permissions-view.tsx'),
      'utf-8',
    )
    if (!permissions.includes('IA pausada')) {
      errors.push('chat-permissions-view must show agent paused indicator')
    }

    const aiTab = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/settings/ai-training/ai-training-tab.tsx'),
      'utf-8',
    )
    if (!aiTab.includes('não envia WhatsApp')) {
      errors.push('ai-training-tab must warn preview does not send WhatsApp')
    }

    const integrity = readFileSync(
      join(ROOT, 'apps/dashboard/src/lib/whatsapp/runtime-integrity.ts'),
      'utf-8',
    )
    if (!integrity.includes('WHATSAPP_RUNTIME_VERSION = 11')) {
      errors.push('WHATSAPP_RUNTIME_VERSION must be 11')
    }

    const version = readFileSync(join(ROOT, 'version.json'), 'utf-8')
    if (!version.includes('1.7.3-rc') && !version.includes('1.7.4-rc') && !version.includes('1.7.5-rc')) {
      errors.push('version.json must be 1.7.3-rc or newer (RC-29+)')
    }

    return createResult(this.name, errors)
  },
}

export const Rc29Harnesses = [Rc29Harness]
