import { z } from 'zod'

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value: string | boolean) => {
    if (typeof value === 'boolean') return value
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
    throw new Error(`Invalid boolean value: ${value}`)
  })

const numberish = z
  .union([z.number(), z.string()])
  .transform((value: string | number) => {
    const parsed = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid numeric value: ${value}`)
    }
    return parsed
  })

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: numberish.pipe(z.number().int().positive()).default(4000),
  TZ: z.string().min(1).default('America/Sao_Paulo'),
  APP_NAME: z.string().min(1).default('WhatsApp Assistant'),
  APP_VERSION: z.string().min(1).default('1.0.5-rc07'),

  DATABASE_URL: z.string().min(1),

  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().min(1).default('gpt-5-mini'),
  OPENAI_TIMEOUT_MS: numberish.pipe(z.number().int().positive()).default(60000),
  OPENAI_RETRY_ATTEMPTS: numberish.pipe(z.number().int().min(0)).default(3),
  OPENAI_RETRY_DELAY_MS: numberish.pipe(z.number().int().min(0)).default(1000),
  OPENAI_INPUT_PRICE_PER_1M_BRL: numberish.pipe(z.number().min(0)).default(0),
  OPENAI_OUTPUT_PRICE_PER_1M_BRL: numberish.pipe(z.number().min(0)).default(0),
  OPENAI_AVG_COST_PER_1K_TOKENS_BRL: numberish.pipe(z.number().min(0)).default(0.002),

  WHATSAPP_SESSION_PATH: z.string().min(1).default('./storage/whatsapp'),
  WHATSAPP_MONITORED_CHAT_ID: z.string().default(''),
  WHATSAPP_IGNORE_HISTORY: booleanish.default(true),
  WHATSAPP_AUTO_RECONNECT: booleanish.default(true),
  WHATSAPP_RECONNECT_DELAY_MS: numberish.pipe(z.number().int().min(0)).default(5000),

  MEDIA_STORAGE_PATH: z.string().min(1).default('./storage/media'),
  TEMP_STORAGE_PATH: z.string().min(1).default('./storage/temp'),
  BACKUP_PATH: z.string().min(1).default('./backups'),

  COMPANY_NAME: z.string().min(1).default('Minha Empresa'),
  DEFAULT_CURRENCY: z.string().min(1).default('BRL'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  LOG_PRETTY_PRINT: booleanish.default(true),

  AUDIT_ENABLED: booleanish.default(true),
  AUDIT_RETENTION_DAYS: numberish.pipe(z.number().int().positive()).default(3650),

  BACKUP_ENABLED: booleanish.default(true),

  CI: booleanish.default(false),
  DOCKER_BUILD: booleanish.default(false),
})

export type EnvSchemaInput = Record<string, string | boolean | number | undefined>
export type ParsedEnv = z.output<typeof EnvSchema>
