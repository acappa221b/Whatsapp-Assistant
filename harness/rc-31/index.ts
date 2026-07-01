import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc31Harness: Harness = {
  name: 'Rc31Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-31-agent-skip-fix/README.md',
      'docs/prompts/2026-07-01-rc-31-agent-skip-fix.md',
      'docs/investigations/agent-auto-reply-not-sending.md',
      'packages/core/src/domains/agent-chat/tests/recent-context.test.ts',
      'apps/dashboard/src/app/api/settings/ai/test-live-reply/route.ts',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const skipRules = readFileSync(
      join(ROOT, 'packages/core/src/domains/agent-chat/application/should-auto-reply-to-message.ts'),
      'utf-8',
    )
    if (skipRules.includes('trimmed.length <= 12')) {
      errors.push('shouldSkipBeforeLLM must not use generic 12-char ack rule')
    }
    if (!skipRules.includes('tudo bem')) {
      errors.push('GREETING_PATTERN must include tudo bem')
    }

    const useCase = readFileSync(
      join(ROOT, 'packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts'),
      'utf-8',
    )
    if (!useCase.includes('mapRecentRole')) {
      errors.push('process-agent must use mapRecentRole for recentContext')
    }
    if (!useCase.includes('sourceAgent')) {
      errors.push('mapRecentRole must check sourceAgent')
    }
    if (!useCase.includes('skip: ${reason}')) {
      errors.push('logSkip must include reason in message text')
    }

    const appLogger = readFileSync(join(ROOT, 'packages/shared/src/logging/app-logger.ts'), 'utf-8')
    if (!appLogger.includes('[agentchat]')) {
      errors.push('inferDomainFromMessage must map [AgentChat] to ai')
    }

    const logsTab = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/settings/settings-logs-tab.tsx'),
      'utf-8',
    )
    if (!logsTab.includes('item.metadata')) {
      errors.push('settings-logs-tab must render metadata')
    }

    const permissions = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/permissions/chat-permissions-view.tsx'),
      'utf-8',
    )
    if (!permissions.includes('IA pausada — religue Resposta IA')) {
      errors.push('permissions must show agent-paused badge')
    }

    const aiTab = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/settings/ai-training/ai-training-tab.tsx'),
      'utf-8',
    )
    if (!aiTab.includes('simulateLiveGates')) {
      errors.push('ai-training-tab must support simulateLiveGates')
    }

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    if (!readme.includes('skip:')) {
      errors.push('README must document skip reason in logs')
    }

    const version = readFileSync(join(ROOT, 'version.json'), 'utf-8')
    if (!version.includes('1.7.5-rc31')) {
      errors.push('version.json must be 1.7.5-rc31')
    }

    return createResult(this.name, errors)
  },
}

export const Rc31Harnesses = [Rc31Harness]
