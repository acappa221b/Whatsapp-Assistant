import { ZodError } from 'zod'
import { createAppConfig } from './app.config'
import { buildDefaultEnv, pickEnvOverrides } from './build-default-env'
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

let cachedConfig: ResolvedConfig | null = null

function formatConfigError(error: ZodError): string {
  const details = error.issues
    .map((issue: ZodError['issues'][number]) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ')
  return `Invalid environment configuration: ${details}`
}

export function createConfig(
  rawEnv: EnvSchemaInput = process.env,
  options?: { overridesOnly?: boolean },
): ResolvedConfig {
  const mergedEnv = options?.overridesOnly
    ? { ...buildDefaultEnv(), ...rawEnv }
    : {
        ...buildDefaultEnv(),
        ...pickEnvOverrides(rawEnv as Record<string, string | boolean | number | undefined>),
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
  return createConfig(overrides, { overridesOnly: true })
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
  }
}

export const config = new Proxy({} as ResolvedConfig, {
  get(_target, property) {
    return getConfig()[property as keyof ResolvedConfig]
  },
})

export { APP_DEFAULTS } from './app.defaults'
export { logOpenAIApiKeyPresence, calculateTokenCostBrl } from './openai.config'
export type { OpenAIConfig } from './openai.config'
export {
  REPO_ROOT,
  parseSqliteFilePath,
  resolveDatabaseUrl,
  resolveRepoRelativePath,
  sqliteDatabaseExists,
} from './paths'
