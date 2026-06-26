import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { getRuntimeDatabaseDiagnostics, listSqliteTables } from '@finance-ai/database'
import {
  applyConfigToProcessEnv,
  createConfigWithOverrides,
  REPO_ROOT,
  resolveDatabaseUrl,
} from '@finance-ai/shared/config'

async function main() {
  const config = createConfigWithOverrides({
    OPENAI_API_KEY: 'diagnostic-placeholder',
  })
  applyConfigToProcessEnv(config)

  console.log('RC-01 SQLite diagnostic')
  console.log(`repo root: ${REPO_ROOT}`)
  console.log(`configured DATABASE_URL: ${config.env.DATABASE_URL}`)
  console.log(`resolved DATABASE_URL: ${config.database.url}`)

  const diagnostics = getRuntimeDatabaseDiagnostics(config.database.url)
  console.log(`absolute path: ${diagnostics.absolutePath}`)
  console.log(`exists: ${diagnostics.exists}`)
  console.log(`sizeBytes: ${diagnostics.sizeBytes}`)
  console.log(`lastModified: ${diagnostics.lastModified ?? 'n/a'}`)

  if (diagnostics.exists) {
    const tables = await listSqliteTables()
    console.log(`tables: ${tables.join(', ')}`)
  }

  const orphan = join(REPO_ROOT, 'packages/database/prisma/packages/database/prisma/dev.db')
  if (existsSync(orphan)) {
    const orphanStats = statSync(orphan)
    console.log('\norphan database detected')
    console.log(`path: ${orphan}`)
    console.log(`sizeBytes: ${orphanStats.size}`)
  }

  const wrongCwdPath = resolveDatabaseUrl(
    createConfigWithOverrides({
      DATABASE_URL: config.env.DATABASE_URL,
      OPENAI_API_KEY: 'diagnostic-placeholder',
    }).env.DATABASE_URL,
  )
  console.log(`\npath resolution check: ${wrongCwdPath}`)

  const migrationsDir = join(REPO_ROOT, 'packages/database/prisma/migrations')
  const migrations = readdirSync(migrationsDir).filter((entry) => entry !== 'migration_lock.toml')
  console.log(`\nmigration folders (${migrations.length}): ${migrations.join(', ')}`)

  try {
    const status = execSync('npx prisma migrate status', {
      cwd: join(REPO_ROOT, 'packages/database'),
      stdio: 'pipe',
    }).toString()
    console.log('\nprisma migrate status:')
    console.log(status)
  } catch (error) {
    const stdout = (error as { stdout?: Buffer }).stdout?.toString() ?? ''
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? ''
    console.log('\nprisma migrate status:')
    console.log(stdout || stderr)
  }
}

void main()
