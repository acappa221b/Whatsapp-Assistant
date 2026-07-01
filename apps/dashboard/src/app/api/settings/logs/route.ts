import { NextResponse } from 'next/server'
import { prisma, AppLogPrismaRepository } from '@finance-ai/database'
import {
  readLauncherLogs,
  mapDbLogToUnified,
  mergeLogItems,
} from '@/lib/logging/launcher-log-reader'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const level = url.searchParams.get('level')
    const domain = url.searchParams.get('domain') ?? undefined
    const search = url.searchParams.get('search') ?? undefined
    const limit = Number(url.searchParams.get('limit') ?? 200)
    const beforeRaw = url.searchParams.get('before')
    const before = beforeRaw ? new Date(beforeRaw) : undefined
    const includeLauncher = url.searchParams.get('includeLauncher') !== 'false'

    const repo = new AppLogPrismaRepository(prisma)
    const dbRows = await repo.list({
      level: level === 'error' ? 'error' : undefined,
      domain,
      search,
      limit: 500,
      before,
    })
    const dbItems = dbRows.map(mapDbLogToUnified)
    const launcherItems = includeLauncher ? readLauncherLogs() : []
    const merged = mergeLogItems(dbItems, launcherItems, {
      level: level === 'error' ? 'error' : 'all',
      domain,
      search,
      limit: Math.min(limit, 500),
      before,
    })

    return NextResponse.json(merged)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load logs'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const repo = new AppLogPrismaRepository(prisma)
    const deleted = await repo.clear()
    return NextResponse.json({ deleted })
  } catch {
    return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 })
  }
}
