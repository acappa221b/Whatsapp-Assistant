import type { ParsedEnv } from './env.schema'

export type LoggingConfig = {
  level: 'debug' | 'info' | 'warn' | 'error'
  prettyPrint: boolean
}

export function createLoggingConfig(env: ParsedEnv): LoggingConfig {
  return {
    level: env.LOG_LEVEL,
    prettyPrint: env.LOG_PRETTY_PRINT,
  }
}
