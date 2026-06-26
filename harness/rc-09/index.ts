import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc09SpecHarness: Harness = {
  name: 'Rc09SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-09-chat-names-and-media-storage/README.md',
      'specs/rc-09-chat-names-and-media-storage/acceptance-criteria.md',
      'docs/investigations/rc-09-names-and-media-organization.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const ChatMediaStorageHarness: Harness = {
  name: 'ChatMediaStorageHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/shared/src/storage/chat-media-storage.ts'))) {
      errors.push('Missing ChatMediaStorage')
    }
    const downloader = read('packages/whatsapp/src/media/media-downloader.ts')
    if (!downloader.includes('chatId')) {
      errors.push('MediaDownloader must accept chatId for organized paths')
    }
    if (!downloader.includes('photos')) {
      errors.push('MediaDownloader must use photos category paths')
    }
    return createResult(this.name, errors)
  },
}

export const ResolveNamesRouteHarness: Harness = {
  name: 'ResolveNamesRouteHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'apps/dashboard/src/app/api/whatsapp/chats/resolve-names/route.ts'))) {
      errors.push('Missing POST /api/whatsapp/chats/resolve-names')
    }
    const core = read(
      'packages/core/src/domains/whatsapp-chat-config/application/resolve-chat-names.use-case.ts',
    )
    if (!core.includes('ResolveChatNamesUseCase')) {
      errors.push('Missing ResolveChatNamesUseCase')
    }
    return createResult(this.name, errors)
  },
}

export const PermissionsNamesUiHarness: Harness = {
  name: 'PermissionsNamesUiHarness',
  async run() {
    const errors: string[] = []
    const view = read('apps/dashboard/src/components/permissions/chat-permissions-view.tsx')
    if (!view.includes('formatChatListLabel')) {
      errors.push('Permissions must use formatChatListLabel with displayNumber')
    }
    if (!view.includes('displayNumber')) {
      errors.push('Permissions must show displayNumber (#N)')
    }
    if (!view.includes('resolve-names')) {
      errors.push('Permissions must call resolve-names')
    }
    if (!view.includes('Conversa')) {
      // good — should not hardcode generic label
    } else {
      errors.push('Permissions must not render hardcoded "Conversa" label')
    }
    const display = read('packages/shared/src/utils/display-name.ts')
    if (!display.includes('resolvePermissionsChatLabel')) {
      errors.push('Missing resolvePermissionsChatLabel helper')
    }
    return createResult(this.name, errors)
  },
}

export const DeleteDirectoryHarness: Harness = {
  name: 'DeleteDirectoryHarness',
  async run() {
    const errors: string[] = []
    const media = read('apps/dashboard/src/lib/media-storage.ts')
    if (!media.includes('deleteChatMediaDirectory')) {
      errors.push('media-storage must export deleteChatMediaDirectory')
    }
    const useCase = read(
      'packages/core/src/domains/whatsapp-message/application/delete-chat-history.use-case.ts',
    )
    if (!useCase.includes('deleteChatDirectory')) {
      errors.push('DeleteChatHistoryUseCase must delete chat directory')
    }
    return createResult(this.name, errors)
  },
}

export const ResetScriptHarness: Harness = {
  name: 'ResetScriptHarness',
  async run() {
    const errors: string[] = []
    const pkg = read('package.json')
    if (!pkg.includes('rc:09:reset-all-history')) {
      errors.push('Missing pnpm rc:09:reset-all-history script')
    }
    if (!existsSync(join(ROOT, 'packages/database/scripts/rc-09-reset-all-history.ts'))) {
      errors.push('Missing reset script file')
    }
    return createResult(this.name, errors)
  },
}

export const Rc09Harnesses = [
  Rc09SpecHarness,
  ChatMediaStorageHarness,
  ResolveNamesRouteHarness,
  PermissionsNamesUiHarness,
  DeleteDirectoryHarness,
  ResetScriptHarness,
]
