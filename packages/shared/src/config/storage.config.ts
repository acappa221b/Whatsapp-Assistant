import type { ParsedEnv } from './env.schema'
import { resolveRepoRelativePath } from './paths'

export type StorageConfig = {
  mediaPath: string
  tempPath: string
  backupPath: string
}

export function createStorageConfig(env: ParsedEnv): StorageConfig {
  return {
    mediaPath: resolveRepoRelativePath(env.MEDIA_STORAGE_PATH),
    tempPath: resolveRepoRelativePath(env.TEMP_STORAGE_PATH),
    backupPath: resolveRepoRelativePath(env.BACKUP_PATH),
  }
}
