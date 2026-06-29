import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc15Harness: Harness = {
  name: 'Rc15Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-15-dashboard-fixes-assistant-multimodal/README.md',
      'docs/releases/rc-15-dashboard-fixes.md',
      'packages/shared/src/pricing/ai-provider-pricing.ts',
      'apps/dashboard/src/components/whatsapp/whatsapp-connection-panel.tsx',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const layout = readFileSync(join(ROOT, 'apps/dashboard/src/app/dashboard/layout.tsx'), 'utf-8')
    if (!layout.includes('overflow-y-auto') || !layout.includes('wa-scroll')) {
      errors.push('Dashboard layout main must scroll with wa-scroll')
    }

    const sidebar = readFileSync(join(ROOT, 'apps/dashboard/src/components/layout/app-sidebar.tsx'), 'utf-8')
    if (sidebar.includes("'/dashboard/whatsapp'")) {
      errors.push('Sidebar must not link to /dashboard/whatsapp')
    }

    const settings = readFileSync(join(ROOT, 'apps/dashboard/src/app/dashboard/settings/page.tsx'), 'utf-8')
    if (!settings.includes('whatsapp') || !settings.includes('WhatsappConnectionPanel')) {
      errors.push('Settings must include WhatsApp tab')
    }

    const sort = readFileSync(join(ROOT, 'packages/shared/src/utils/sort-chat-permissions.ts'), 'utf-8')
    if (!sort.includes('displayNumber - b.row.displayNumber')) {
      errors.push('sortChats must sort name column by displayNumber first')
    }

    const pricing = readFileSync(join(ROOT, 'packages/shared/src/pricing/ai-provider-pricing.ts'), 'utf-8')
    if (!pricing.includes('estimateTokenCostBrl')) {
      errors.push('Missing estimateTokenCostBrl')
    }

    const agent = readFileSync(
      join(ROOT, 'packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts'),
      'utf-8',
    )
    if (!agent.includes('stripMediaPrefix')) {
      errors.push('Agent must strip media prefix before skip checks')
    }

    return createResult(this.name, errors)
  },
}

export const Rc15Harnesses = [Rc15Harness]
