import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc13SpecHarness: Harness = {
  name: 'Rc13SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-13-permissions-sort-assistant-ops/README.md',
      'specs/rc-13-permissions-sort-assistant-ops/acceptance-criteria.md',
      'docs/adr/014-assistant-command-executor.md',
      'docs/prompts/2025-06-26-rc-13-permissions-assistant-ops.md',
      'docs/releases/rc-13-permissions-assistant-ops.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const Rc13OpsHarness: Harness = {
  name: 'Rc13OpsHarness',
  async run() {
    const errors: string[] = []
    const permissions = read('apps/dashboard/src/components/permissions/chat-permissions-view.tsx')
    if (!permissions.includes('sortChats') || !permissions.includes('aria-sort')) {
      errors.push('Permissions table must support client-side sorting')
    }
    if (!existsSync(join(ROOT, 'packages/core/src/domains/assistant-ops/domain/assistant-command.types.ts'))) {
      errors.push('Missing AssistantCommand types')
    }
    if (!existsSync(join(ROOT, 'packages/core/src/domains/assistant-ops/application/execute-assistant-command.use-case.ts'))) {
      errors.push('Missing ExecuteAssistantCommandUseCase')
    }
    const service = read('apps/dashboard/src/lib/assistant/assistant-service.ts')
    if (!service.includes("phase: 'preview'") || !service.includes('actionToken')) {
      errors.push('Assistant service must support 2-phase preview/confirm')
    }
    if (!existsSync(join(ROOT, 'packages/database/prisma/migrations/20260629120000_0012_rc13_assistant_action_log/migration.sql'))) {
      errors.push('Missing AssistantActionLog migration')
    }
    return createResult(this.name, errors)
  },
}

export const Rc13Harnesses = [Rc13SpecHarness, Rc13OpsHarness]
