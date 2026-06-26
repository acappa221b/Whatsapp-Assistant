import { statSync } from 'node:fs'
import { parseSqliteFilePath, resolveDatabaseUrl, sqliteDatabaseExists } from '@finance-ai/shared/config'

export type RuntimeDatabaseDiagnostics = {
  configuredUrl: string
  resolvedUrl: string
  absolutePath: string
  exists: boolean
  sizeBytes: number
  lastModified: string | null
}

export function getRuntimeDatabaseDiagnostics(databaseUrl: string): RuntimeDatabaseDiagnostics {
  const resolvedUrl = resolveDatabaseUrl(databaseUrl)
  const absolutePath = parseSqliteFilePath(resolvedUrl)
  const exists = sqliteDatabaseExists(resolvedUrl)

  if (!exists) {
    return {
      configuredUrl: databaseUrl,
      resolvedUrl,
      absolutePath,
      exists: false,
      sizeBytes: 0,
      lastModified: null,
    }
  }

  const stats = statSync(absolutePath)
  return {
    configuredUrl: databaseUrl,
    resolvedUrl,
    absolutePath,
    exists: true,
    sizeBytes: stats.size,
    lastModified: stats.mtime.toISOString(),
  }
}
