import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ZodError } from 'zod'
import { createAppConfig } from './app.config'
import { createDatabaseConfig } from './database.config'
import {
  REPO_ROOT,
  parseSqliteFilePath,
  resolveDatabaseUrl,
  resolveRepoRelativePath,
  sqliteDatabaseExists,
} from './paths'
import { EnvSchema, type EnvSchemaInput, type ParsedEnv } from './env.schema'
import { createLoggingConfig } from './logging.config'
import { createOpenAIConfig, type OpenAIConfig } from './openai.config'
import { createStorageConfig } from './storage.config'
import { createWhatsappConfig } from './whatsapp.config'

export type ResolvedConfig = {
  app: ReturnType<typeof createAppConfig>
  database: ReturnType<typeof createDatabaseConfig>
  openai: OpenAIConfig
  whatsapp: ReturnType<typeof createWhatsappConfig>
  storage: ReturnType<typeof createStorageConfig>
  logging: ReturnType<typeof createLoggingConfig>
  env: ParsedEnv
}

const ENV_PATH = resolve(REPO_ROOT, '.env')

let cachedConfig: ResolvedConfig | null = null

function parseDotEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const equalsIndex = line.indexOf('=')
    if (equalsIndex < 0) continue
    const key = line.slice(0, equalsIndex).trim()
    let value = line.slice(equalsIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function loadRootEnvFile(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {}
  return parseDotEnv(readFileSync(ENV_PATH, 'utf-8'))
}

function formatConfigError(error: ZodError): string {
  const details = error.issues
    .map((issue: ZodError['issues'][number]) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ')
  return `Invalid environment configuration: ${details}`
}

export function createConfig(
  rawEnv: EnvSchemaInput = process.env,
  options?: { skipEnvFile?: boolean },
): ResolvedConfig {
  const mergedEnv = options?.skipEnvFile
    ? { ...rawEnv }
    : {
        ...loadRootEnvFile(),
        ...rawEnv,
      }

  const parsed = EnvSchema.safeParse(mergedEnv)
  if (!parsed.success) {
    throw new Error(formatConfigError(parsed.error))
  }

  const env = parsed.data

  const openai = new Proxy({} as OpenAIConfig, {
    get(_target, property) {
      return createOpenAIConfig(env)[property as keyof OpenAIConfig]
    },
  })

  return {
    app: createAppConfig(env),
    database: createDatabaseConfig(env),
    openai,
    whatsapp: createWhatsappConfig(env),
    storage: createStorageConfig(env),
    logging: createLoggingConfig(env),
    env,
  }
}

export function createConfigWithOverrides(overrides: EnvSchemaInput): ResolvedConfig {
  return createConfig({
    ...(process.env as Record<string, string | undefined>),
    ...overrides,
  })
}

export function getConfig(): ResolvedConfig {
  if (!cachedConfig) {
    cachedConfig = createConfig()
  }
  return cachedConfig
}

export function resetConfigCache(): void {
  cachedConfig = null
}

export function applyConfigToProcessEnv(resolved: ResolvedConfig = getConfig()): void {
  cachedConfig = resolved
}

export function createProcessEnv(
  resolved: ResolvedConfig,
  baseEnv: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  return {
    ...baseEnv,
    NODE_ENV: resolved.app.nodeEnv,
    TZ: resolved.app.timezone,
    DATABASE_URL: resolved.database.url,
    OPENAI_API_KEY: resolved.openai.apiKey,
    OPENAI_MODEL: resolved.openai.model,
  }
}

export const config = new Proxy({} as ResolvedConfig, {
  get(_target, property) {
    return getConfig()[property as keyof ResolvedConfig]
  },
})

export { logOpenAIApiKeyPresence, calculateTokenCostBrl } from './openai.config'
export type { OpenAIConfig } from './openai.config'
export {
  REPO_ROOT,
  parseSqliteFilePath,
  resolveDatabaseUrl,
  resolveRepoRelativePath,
  sqliteDatabaseExists,
} from './paths'
