import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from './types'
import { createResult } from './types'

const ROOT = join(import.meta.dirname, '..')
const ENV_EXAMPLE = join(ROOT, '.env.example')
const CONFIG_INDEX = join(ROOT, 'packages/shared/src/config/index.ts')
const ENV_SCHEMA = join(ROOT, 'packages/shared/src/config/env.schema.ts')
const DOCS = join(ROOT, 'docs/setup/environment.md')

export const ConfigurationHarness: Harness = {
  name: 'ConfigurationHarness',
  async run() {
    const errors: string[] = []

    if (!existsSync(ENV_EXAMPLE)) {
      errors.push('Missing .env.example')
    } else {
      const envExample = readFileSync(ENV_EXAMPLE, 'utf-8')
      for (const key of ['APP_VERSION=1.0.5-rc07', 'OPENAI_API_KEY=""', 'WHATSAPP_SESSION_PATH', 'BACKUP_PATH']) {
        if (!envExample.includes(key)) {
          errors.push(`.env.example missing key: ${key}`)
        }
      }
    }

    if (!existsSync(CONFIG_INDEX)) {
      errors.push('Missing config service index')
    } else {
      const configIndex = readFileSync(CONFIG_INDEX, 'utf-8')
      for (const key of ['new Proxy', 'createConfig', 'app:', 'database:', 'openai:']) {
        if (!configIndex.includes(key)) {
          errors.push(`config service missing: ${key}`)
        }
      }
    }

    if (!existsSync(ENV_SCHEMA)) {
      errors.push('Missing env.schema.ts')
    } else {
      const envSchema = readFileSync(ENV_SCHEMA, 'utf-8')
      for (const key of ['EnvSchema', 'OPENAI_API_KEY', 'DATABASE_URL', 'WHATSAPP_SESSION_PATH']) {
        if (!envSchema.includes(key)) {
          errors.push(`env schema missing: ${key}`)
        }
      }
    }

    if (!existsSync(DOCS)) {
      errors.push('Missing docs/setup/environment.md')
    }

    return createResult(this.name, errors)
  },
}
