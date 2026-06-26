import { NextResponse } from 'next/server'
import {
  countAppliedMigrations,
  getRuntimeDatabaseDiagnostics,
  listSqliteTables,
  prisma,
} from '@finance-ai/database'
import { config } from '@finance-ai/shared/config'

export async function GET() {
  const diagnostics = getRuntimeDatabaseDiagnostics(config.database.url)

  try {
    await prisma.$queryRaw`SELECT 1`
    const tables = await listSqliteTables()
    const migrationsApplied = await countAppliedMigrations()

    return NextResponse.json({
      status: 'ok',
      connection: 'ok',
      database: {
        configured: diagnostics.configuredUrl.replace(/file:.*\//, 'file:.../'),
        resolvedPath: diagnostics.absolutePath,
        exists: diagnostics.exists,
        sizeBytes: diagnostics.sizeBytes,
        lastModified: diagnostics.lastModified,
      },
      schema: {
        tableCount: tables.length,
        tables,
      },
      migrations: {
        applied: migrationsApplied,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database health check failed'
    return NextResponse.json(
      {
        status: 'error',
        connection: 'failed',
        database: {
          configured: diagnostics.configuredUrl.replace(/file:.*\//, 'file:.../'),
          resolvedPath: diagnostics.absolutePath,
          exists: diagnostics.exists,
          sizeBytes: diagnostics.sizeBytes,
          lastModified: diagnostics.lastModified,
        },
        error: message,
      },
      { status: 503 },
    )
  }
}
