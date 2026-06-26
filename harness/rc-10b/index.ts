import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc10bSpecHarness: Harness = {
  name: 'Rc10bSpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-10b-agent-reply-discipline/README.md',
      'specs/rc-10b-agent-reply-discipline/acceptance-criteria.md',
      'docs/investigations/rc-10b-agent-reply-discipline.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const ReplyDisciplineHarness: Harness = {
  name: 'ReplyDisciplineHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/core/src/domains/agent-chat/application/should-auto-reply-to-message.ts'))) {
      errors.push('Missing should-auto-reply-to-message.ts')
    }
    if (!existsSync(join(ROOT, 'packages/shared/src/utils/agent-reply-guard.ts'))) {
      errors.push('Missing agent-reply-guard.ts')
    }
    const openai = read('packages/ai/src/providers/openai-chat.provider.ts')
    if (!openai.includes("action: z.enum(['reply', 'skip', 'defer'])")) {
      errors.push('OpenAI schema must include action reply|skip|defer')
    }
    const useCase = read('packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts')
    if (!useCase.includes('shouldSkipBeforeLLM')) {
      errors.push('ProcessAgentAutoReplyUseCase must call shouldSkipBeforeLLM')
    }
    if (!useCase.includes('replyDeduplicator')) {
      errors.push('ProcessAgentAutoReplyUseCase must use replyDeduplicator')
    }
    if (!useCase.includes('sanitizeAgentReply')) {
      errors.push('ProcessAgentAutoReplyUseCase must use sanitizeAgentReply')
    }
    return createResult(this.name, errors)
  },
}

export const Rc10bHarnesses = [Rc10bSpecHarness, ReplyDisciplineHarness]
