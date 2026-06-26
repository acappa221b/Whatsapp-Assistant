import { resolve } from 'node:path'
import { unlink } from 'node:fs/promises'
import { config } from '@finance-ai/shared/config'
import { ChatMediaStorage } from '@finance-ai/shared/storage'

const chatMediaStorage = new ChatMediaStorage(resolve(config.storage.mediaPath))

export async function deleteStoredMediaFile(storagePath: string): Promise<boolean> {
  const trimmed = storagePath.trim()
  if (!trimmed) return false

  const mediaRoot = resolve(config.storage.mediaPath)
  const absolutePath = resolve(mediaRoot, trimmed)
  if (!absolutePath.startsWith(mediaRoot)) return false

  try {
    await unlink(absolutePath)
    return true
  } catch {
    return false
  }
}

export async function deleteChatMediaDirectory(input: {
  chatId: string
  displayName: string | null
  storageDir?: string | null
}): Promise<{ deletedFiles: number }> {
  return chatMediaStorage.deleteChatDirectory(
    input.chatId,
    input.displayName?.trim() || 'chat',
    input.storageDir,
  )
}

export function createChatMediaCleanup() {
  return {
    deleteFile: deleteStoredMediaFile,
    deleteChatDirectory: deleteChatMediaDirectory,
  }
}
