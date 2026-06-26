import type { ParsedEnv } from './env.schema'
import { resolveDatabaseUrl } from './paths'

export type DatabaseConfig = {
  url: string
}

const CANONICAL_DATABASE_PATH = 'file:./packages/database/prisma/dev.db'

function isLegacyRootDatabaseUrl(url: string): boolean {
  const normalized = url.replace(/\\/g, '/').toLowerCase()
  return normalized.endsWith('/dev.db') && !normalized.includes('/packages/database/prisma/dev.db')
}

export function createDatabaseConfig(env: ParsedEnv): DatabaseConfig {
  const resolved = resolveDatabaseUrl(env.DATABASE_URL)
  if (isLegacyRootDatabaseUrl(resolved)) {
    return {
      url: resolveDatabaseUrl(CANONICAL_DATABASE_PATH),
    }
  }

  return {
    url: resolved,
  }
}
