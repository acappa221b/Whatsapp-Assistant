import type { ParsedEnv } from './env.schema'

export type AppConfig = {
  name: string
  version: string
  nodeEnv: ParsedEnv['NODE_ENV']
  port: number
  timezone: string
  companyName: string
  defaultCurrency: string
  auditEnabled: boolean
  auditRetentionDays: number
  backupEnabled: boolean
  backupPath: string
  isCi: boolean
  dockerBuild: boolean
}

export function createAppConfig(env: ParsedEnv): AppConfig {
  return {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    timezone: env.TZ,
    companyName: env.COMPANY_NAME,
    defaultCurrency: env.DEFAULT_CURRENCY,
    auditEnabled: env.AUDIT_ENABLED,
    auditRetentionDays: env.AUDIT_RETENTION_DAYS,
    backupEnabled: env.BACKUP_ENABLED,
    backupPath: env.BACKUP_PATH,
    isCi: env.CI,
    dockerBuild: env.DOCKER_BUILD,
  }
}
