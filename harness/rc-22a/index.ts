import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc22aHarness: Harness = {
  name: 'Rc22aHarness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-22a-message-driven-sync/README.md',
      'docs/adr/020-message-driven-chat-discovery.md',
      'docs/releases/rc-22a-message-driven-sync.md',
      'packages/shared/src/whatsapp/discovery-policy.ts',
      'packages/core/src/domains/whatsapp-chat-config/application/prune-orphan-chat-configs.use-case.ts',
      'apps/dashboard/src/app/api/whatsapp/chats/prune-orphans/route.ts',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const schema = readFileSync(join(ROOT, 'packages/database/prisma/schema.prisma'), 'utf-8')
    if (!schema.includes('syncGroupsEnabled')) errors.push('schema must define syncGroupsEnabled')

    const runtime = readFileSync(join(ROOT, 'apps/dashboard/src/lib/whatsapp/runtime.ts'), 'utf-8')
    if (!runtime.includes('shouldDiscoverChatConfig')) {
      errors.push('runtime must gate discovery with shouldDiscoverChatConfig')
    }
    if (runtime.includes('ensureChatDiscoveredUseCase.execute(jid, name)')) {
      errors.push('runtime must not ensure chat config from contact discovery')
    }

    const contactDiscovery = readFileSync(
      join(ROOT, 'packages/whatsapp/src/utils/contact-discovery.ts'),
      'utf-8',
    )
    if (!contactDiscovery.includes('syncAddressBookEnabled')) {
      errors.push('contact-discovery must respect syncAddressBookEnabled')
    }

    const groupDiscovery = readFileSync(
      join(ROOT, 'packages/whatsapp/src/utils/group-discovery.ts'),
      'utf-8',
    )
    if (!groupDiscovery.includes('discoveryPolicy')) {
      errors.push('group-discovery must accept discoveryPolicy')
    }

    const settings = readFileSync(join(ROOT, 'apps/dashboard/src/app/dashboard/settings/page.tsx'), 'utf-8')
    if (!settings.includes('syncGroupsEnabled')) {
      errors.push('settings must expose sync toggles')
    }

    const permissions = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/permissions/chat-permissions-view.tsx'),
      'utf-8',
    )
    if (!permissions.includes('prune-orphans')) {
      errors.push('permissions UI must call prune-orphans API')
    }

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    if (!readme.includes('RC-22A') && !readme.toLowerCase().includes('message-driven')) {
      errors.push('README must mention RC-22A message-driven sync')
    }

    const manifest = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf-8')) as {
      version: string
    }
    if (manifest.version !== '1.6.0-rc22') {
      errors.push(`version.json must be 1.6.0-rc22 (got ${manifest.version})`)
    }

    return createResult(this.name, errors)
  },
}

export const Rc22aHarnesses = [Rc22aHarness]
