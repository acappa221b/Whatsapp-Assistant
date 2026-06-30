import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc17Harness: Harness = {
  name: 'Rc17Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-17-ai-training-module/README.md',
      'docs/adr/016-ai-training-persona-knowledge.md',
      'docs/releases/rc-17-ai-training.md',
      'packages/shared/src/ai-training/presets.ts',
      'packages/core/src/domains/ai-training/application/compose-agent-prompt.use-case.ts',
      'apps/dashboard/src/components/settings/ai-training/ai-training-tab.tsx',
      'apps/dashboard/public/templates/catalogo-precos.xlsx',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const settings = readFileSync(join(ROOT, 'apps/dashboard/src/app/dashboard/settings/page.tsx'), 'utf-8')
    if (!settings.includes("'ia'") || !settings.includes('AiTrainingTab')) {
      errors.push('Settings must include IA tab')
    }

    const agent = readFileSync(
      join(ROOT, 'packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts'),
      'utf-8',
    )
    if (!agent.includes('composeAgentPrompt') || !agent.includes('systemPrompt')) {
      errors.push('Agent auto-reply must use composed systemPrompt')
    }

    const provider = readFileSync(
      join(ROOT, 'packages/ai/src/providers/openai-chat.provider.ts'),
      'utf-8',
    )
    if (!provider.includes('systemPrompt')) {
      errors.push('OpenAIChatProvider must accept systemPrompt')
    }

    return createResult(this.name, errors)
  },
}

export const Rc17Harnesses = [Rc17Harness]
