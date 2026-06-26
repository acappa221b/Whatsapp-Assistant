import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { config } from '../config/index'
import { buildChatDirName } from './build-chat-dir-name'

export type MediaCategory = 'photos' | 'audio' | 'messages' | 'reports'

const CATEGORY_DIRS: MediaCategory[] = ['messages', 'photos', 'reports', 'audio']

export function resolveMediaCategory(
  messageType: 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'STICKER' | 'TEXT' | string,
  mimeType?: string | null,
): MediaCategory {
  const normalized = messageType.toUpperCase()
  if (normalized === 'IMAGE' || normalized === 'STICKER') return 'photos'
  if (normalized === 'AUDIO' || normalized === 'PTT') return 'audio'
  if (normalized === 'TEXT') return 'messages'
  if (normalized === 'DOCUMENT') {
    if (mimeType?.toLowerCase().includes('pdf')) return 'reports'
    return 'reports'
  }
  return 'messages'
}

export class ChatMediaStorage {
  constructor(private readonly mediaRootPath = resolve(process.cwd(), config.storage.mediaPath)) {}

  getMediaRoot(): string {
    return this.mediaRootPath
  }

  resolveChatDirName(chatId: string, displayName: string, storageDir?: string | null): string {
    return storageDir?.trim() || buildChatDirName(displayName, chatId)
  }

  getChatAbsoluteDir(chatId: string, displayName: string, storageDir?: string | null): string {
    const dirName = this.resolveChatDirName(chatId, displayName, storageDir)
    const absolute = resolve(this.mediaRootPath, dirName)
    if (!absolute.startsWith(this.mediaRootPath)) {
      throw new Error('Invalid chat media directory')
    }
    return absolute
  }

  async ensureChatStructure(
    chatId: string,
    displayName: string,
    storageDir?: string | null,
  ): Promise<string> {
    const chatAbsolute = this.getChatAbsoluteDir(chatId, displayName, storageDir)
    await mkdir(chatAbsolute, { recursive: true })
    for (const category of CATEGORY_DIRS) {
      await mkdir(join(chatAbsolute, category), { recursive: true })
    }
    return this.resolveChatDirName(chatId, displayName, storageDir)
  }

  async resolvePath(
    chatId: string,
    displayName: string,
    category: MediaCategory,
    fileName: string,
    storageDir?: string | null,
  ): Promise<{ storagePath: string; absolutePath: string; chatDir: string }> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-')
    const chatDir = await this.ensureChatStructure(chatId, displayName, storageDir)
    const relative = `${chatDir}/${category}/${safeName}`.replace(/\\/g, '/')
    const absolutePath = resolve(this.mediaRootPath, relative)
    if (!absolutePath.startsWith(this.mediaRootPath)) {
      throw new Error('Invalid media storage path')
    }
    await mkdir(dirname(absolutePath), { recursive: true })
    return { storagePath: relative, absolutePath, chatDir }
  }

  async deleteChatDirectory(
    chatId: string,
    displayName: string,
    storageDir?: string | null,
  ): Promise<{ deletedFiles: number }> {
    const chatAbsolute = this.getChatAbsoluteDir(chatId, displayName, storageDir)
    let deletedFiles = 0
    try {
      deletedFiles = await this.countFilesRecursive(chatAbsolute)
      await rm(chatAbsolute, { recursive: true, force: true })
    } catch {
      // directory may not exist
    }

    const suffix = chatId.replace(/@.+$/, '').slice(-8)
    if (suffix) {
      deletedFiles += await this.deleteOrphanDirsBySuffix(suffix, chatAbsolute)
    }

    return { deletedFiles }
  }

  async migrateLegacyFlatFile(
    oldStoragePath: string,
    chatId: string,
    displayName: string,
    category: MediaCategory,
    storageDir?: string | null,
  ): Promise<string | null> {
    const trimmed = oldStoragePath.trim()
    if (!trimmed || trimmed.includes('/')) return null

    const source = resolve(this.mediaRootPath, trimmed)
    if (!source.startsWith(this.mediaRootPath)) return null

    try {
      await stat(source)
    } catch {
      return null
    }

    const fileName = trimmed.split(/[/\\]/).pop() ?? trimmed
    const target = await this.resolvePath(chatId, displayName, category, fileName, storageDir)
    await rename(source, target.absolutePath)
    return target.storagePath
  }

  async migrateChatDirectory(
    oldDir: string,
    chatId: string,
    newDisplayName: string,
    storageDir?: string | null,
  ): Promise<string | null> {
    const oldAbsolute = resolve(this.mediaRootPath, oldDir)
    if (!oldAbsolute.startsWith(this.mediaRootPath)) return null

    const newDir = this.resolveChatDirName(chatId, newDisplayName, storageDir)
    const newAbsolute = resolve(this.mediaRootPath, newDir)
    if (oldAbsolute === newAbsolute) return newDir

    try {
      await stat(oldAbsolute)
      await mkdir(dirname(newAbsolute), { recursive: true })
      await rename(oldAbsolute, newAbsolute)
      return newDir
    } catch {
      return null
    }
  }

  private async deleteOrphanDirsBySuffix(suffix: string, skipAbsolute: string): Promise<number> {
    let deleted = 0
    let entries: string[] = []
    try {
      entries = await readdir(this.mediaRootPath)
    } catch {
      return 0
    }

    for (const entry of entries) {
      if (!entry.endsWith(`_${suffix}`)) continue
      const absolute = resolve(this.mediaRootPath, entry)
      if (absolute === skipAbsolute) continue
      try {
        const st = await stat(absolute)
        if (!st.isDirectory()) continue
        deleted += await this.countFilesRecursive(absolute)
        await rm(absolute, { recursive: true, force: true })
      } catch {
        // skip
      }
    }
    return deleted
  }

  private async countFilesRecursive(dir: string): Promise<number> {
    let count = 0
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          count += await this.countFilesRecursive(full)
        } else if (entry.isFile()) {
          count += 1
        }
      }
    } catch {
      return count
    }
    return count
  }
}
