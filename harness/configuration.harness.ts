import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from './types'
import { createResult } from './types'

const ROOT = join(import.meta.dirname, '..')
const CONFIG_INDEX = join(ROOT, 'packages/shared/src/config/index.ts')
const ENV_SCHEMA = join(ROOT, 'packages/shared/src/config/env.schema.ts')
const DOCS = join(ROOT, 'docs/setup/environment.md')

export const ConfigurationHarness: Harness = {
  name: 'ConfigurationHarness',
  async run() {
    const errors: string[] = []

    if (existsSync(join(ROOT, '.env.example'))) {
      errors.push('.env.example must not exist (zero-env architecture)')
    }

    if (!existsSync(CONFIG_INDEX)) {
      errors.push('Missing config service index')
    } else {
      const configIndex = readFileSync(CONFIG_INDEX, 'utf-8')
      if (configIndex.includes('loadRootEnvFile')) {
        errors.push('config must not load .env files from disk')
      }
      for (const key of ['createConfig', 'APP_DEFAULTS', 'buildDefaultEnv']) {
        if (!configIndex.includes(key)) {
          errors.push(`config service missing: ${key}`)
        }
      }
    }

    if (!existsSync(ENV_SCHEMA)) {
      errors.push('Missing env.schema.ts')
    } else {
      const envSchema = readFileSync(ENV_SCHEMA, 'utf-8')
      if (!envSchema.includes('DATABASE_URL')) {
        errors.push('env schema missing DATABASE_URL')
      }
    }

    if (!existsSync(DOCS)) {
      errors.push('Missing docs/setup/environment.md')
    }

    return createResult(this.name, errors)
  },
}
