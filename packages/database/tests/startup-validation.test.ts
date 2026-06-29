import { describe, expect, it } from 'vitest'
import { createConfig } from '@finance-ai/shared/config'
import { validateRuntimeStartup } from '../src/startup-validation'
import { createIsolatedTestDatabase } from './helpers/test-database'

describe('startup validation', () => {
  it('accepts migrated isolated sqlite database', async () => {
    const testDb = createIsolatedTestDatabase()
    const configWithDb = createConfig(
      {
        NODE_ENV: 'test',
        DATABASE_URL: testDb.databaseUrl,
        MEDIA_STORAGE_PATH: './storage/media-test',
        TEMP_STORAGE_PATH: './storage/temp-test',
        WHATSAPP_SESSION_PATH: './storage/whatsapp-test',
        BACKUP_PATH: './backups-test',
      },
      { overridesOnly: true },
    )

    const result = await validateRuntimeStartup(configWithDb, testDb.prisma)
    expect(result.missingTables).toEqual([])
    expect(result.tables.length).toBeGreaterThan(0)

    await testDb.cleanup()
  })
})
