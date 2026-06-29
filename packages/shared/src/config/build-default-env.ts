import { APP_DEFAULTS } from './app.defaults'

const ALLOWED_ENV_KEYS = new Set(['NODE_ENV', 'PORT', 'DATABASE_URL', 'CI', 'TZ', 'DOCKER_BUILD'])

export function buildDefaultEnv(): Record<string, string> {
  return {
    NODE_ENV: 'development',
    PORT: String(APP_DEFAULTS.port),
    TZ: APP_DEFAULTS.timezone,
    APP_NAME: APP_DEFAULTS.appName,
    APP_VERSION: APP_DEFAULTS.appVersion,
    DATABASE_URL: `file:${APP_DEFAULTS.databaseRelativePath}`,
    OPENAI_API_KEY: '',
    OPENAI_MODEL: APP_DEFAULTS.openaiModel,
    OPENAI_TIMEOUT_MS: String(APP_DEFAULTS.openaiTimeoutMs),
    OPENAI_RETRY_ATTEMPTS: String(APP_DEFAULTS.openaiRetryAttempts),
    OPENAI_RETRY_DELAY_MS: String(APP_DEFAULTS.openaiRetryDelayMs),
    OPENAI_INPUT_PRICE_PER_1M_BRL: '0',
    OPENAI_OUTPUT_PRICE_PER_1M_BRL: '0',
    OPENAI_AVG_COST_PER_1K_TOKENS_BRL: String(APP_DEFAULTS.openaiAvgCostPer1kTokensBrl),
    WHATSAPP_SESSION_PATH: APP_DEFAULTS.whatsappSessionPath,
    WHATSAPP_MONITORED_CHAT_ID: '',
    WHATSAPP_IGNORE_HISTORY: String(APP_DEFAULTS.whatsappIgnoreHistory),
    WHATSAPP_AUTO_RECONNECT: String(APP_DEFAULTS.whatsappAutoReconnect),
    WHATSAPP_RECONNECT_DELAY_MS: String(APP_DEFAULTS.whatsappReconnectDelayMs),
    MEDIA_STORAGE_PATH: APP_DEFAULTS.mediaStoragePath,
    TEMP_STORAGE_PATH: APP_DEFAULTS.tempStoragePath,
    BACKUP_PATH: APP_DEFAULTS.backupPath,
    COMPANY_NAME: APP_DEFAULTS.companyName,
    DEFAULT_CURRENCY: APP_DEFAULTS.defaultCurrency,
    LOG_LEVEL: APP_DEFAULTS.logLevel,
    LOG_PRETTY_PRINT: String(APP_DEFAULTS.logPrettyPrint),
    AUDIT_ENABLED: String(APP_DEFAULTS.auditEnabled),
    AUDIT_RETENTION_DAYS: String(APP_DEFAULTS.auditRetentionDays),
    BACKUP_ENABLED: String(APP_DEFAULTS.backupEnabled),
    CI: 'false',
    DOCKER_BUILD: 'false',
    SETTINGS_ENCRYPTION_SECRET: '',
  }
}

export function pickEnvOverrides(
  raw: Record<string, string | boolean | number | undefined>,
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!ALLOWED_ENV_KEYS.has(key) || value === undefined) continue
    result[key] = String(value)
  }
  return result
}
