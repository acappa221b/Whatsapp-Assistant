import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc08bSpecHarness: Harness = {
  name: 'Rc08bSpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-08b-chat-permissions/README.md',
      'specs/rc-08b-chat-permissions/acceptance-criteria.md',
      'specs/rc-08b-chat-permissions/test-matrix.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const ArchiveEnabledSchemaHarness: Harness = {
  name: 'ArchiveEnabledSchemaHarness',
  async run() {
    const errors: string[] = []
    const schema = read('packages/database/prisma/schema.prisma')
    if (!schema.includes('archiveEnabled')) {
      errors.push('schema.prisma must include archiveEnabled on WhatsappChatConfig')
    }
    const migrationDir = join(
      ROOT,
      'packages/database/prisma/migrations/20260626100000_0007_rc08b_archive_enabled',
    )
    if (!existsSync(migrationDir)) {
      errors.push('Missing rc08b archive_enabled migration')
    }
    return createResult(this.name, errors)
  },
}

export const PermissionsSidebarHarness: Harness = {
  name: 'PermissionsSidebarHarness',
  async run() {
    const errors: string[] = []
    const sidebar = read('apps/dashboard/src/components/layout/app-sidebar.tsx')
    if (!sidebar.includes("'/dashboard/permissions'")) {
      errors.push('Sidebar must link to /dashboard/permissions')
    }
    if (!sidebar.includes('Permissões')) {
      errors.push('Sidebar must include Permissões label')
    }
    const match = sidebar.match(/NAV_ITEMS\s*=\s*\[([\s\S]*?)\]\s*as const/)
    if (!match?.[1]?.includes("'/dashboard/permissions'")) {
      errors.push('Permissões must be in NAV_ITEMS')
    } else {
      const itemsBlock = match[1]
      const permissionsIndex = itemsBlock.indexOf("'/dashboard/permissions'")
      const dashboardIndex = itemsBlock.indexOf("'/dashboard'")
      if (permissionsIndex === -1 || dashboardIndex === -1 || permissionsIndex > dashboardIndex) {
        errors.push('Permissões must be first NAV item before Dashboard')
      }
    }
    return createResult(this.name, errors)
  },
}

export const DeleteHistoryRouteHarness: Harness = {
  name: 'DeleteHistoryRouteHarness',
  async run() {
    const errors: string[] = []
    const routePath = 'apps/dashboard/src/app/api/whatsapp/chats/[chatId]/history/route.ts'
    if (!existsSync(join(ROOT, routePath))) {
      errors.push('Missing DELETE /api/whatsapp/chats/[chatId]/history route')
      return createResult(this.name, errors)
    }
    const route = read(routePath)
    if (!route.includes('deleteChatHistoryUseCase')) {
      errors.push('history route must call deleteChatHistoryUseCase')
    }
    if (!route.includes('export async function DELETE')) {
      errors.push('history route must export DELETE handler')
    }
    return createResult(this.name, errors)
  },
}

export const ArchiveFilterHarness: Harness = {
  name: 'ArchiveFilterHarness',
  async run() {
    const errors: string[] = []
    const repo = read('packages/database/src/repositories/whatsapp-message.prisma-repository.ts')
    if (!repo.includes('archiveEnabled')) {
      errors.push('listChatSummaries must filter by archiveEnabled')
    }
    const messagesRoute = read('apps/dashboard/src/app/api/whatsapp/messages/route.ts')
    if (!messagesRoute.includes('Chat not enabled for archive')) {
      errors.push('messages route must guard archiveEnabled with 403')
    }
    return createResult(this.name, errors)
  },
}

export const PermissionsPageHarness: Harness = {
  name: 'PermissionsPageHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'apps/dashboard/src/app/dashboard/permissions/page.tsx'))) {
      errors.push('Missing /dashboard/permissions page')
    }
    const view = read('apps/dashboard/src/components/permissions/chat-permissions-view.tsx')
    if (!view.includes('archiveEnabled')) {
      errors.push('ChatPermissionsView must use archiveEnabled')
    }
    if (!view.includes('ToggleSwitch')) {
      errors.push('ChatPermissionsView must use ToggleSwitch')
    }
    const chatsPage = read('apps/dashboard/src/app/dashboard/chats/page.tsx')
    if (!chatsPage.includes('/dashboard/permissions')) {
      errors.push('/dashboard/chats must redirect to permissions')
    }
    return createResult(this.name, errors)
  },
}

export const Rc08bHarnesses = [
  Rc08bSpecHarness,
  ArchiveEnabledSchemaHarness,
  PermissionsSidebarHarness,
  DeleteHistoryRouteHarness,
  ArchiveFilterHarness,
  PermissionsPageHarness,
]
