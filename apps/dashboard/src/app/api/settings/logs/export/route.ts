import { NextResponse } from 'next/server'
import { prisma, AppLogPrismaRepository } from '@finance-ai/database'
import {
  readLauncherLogs,
  mapDbLogToUnified,
  mergeLogItems,
} from '@/lib/logging/launcher-log-reader'

function formatExportLine(iso: string, level: string, domain: string, message: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const timestamp = Number.isNaN(date.getTime())
    ? iso
    : `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  return `[${timestamp}] [${level.toUpperCase()}] [${domain}] ${message}`
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const level = url.searchParams.get('level')
    const domain = url.searchParams.get('domain') ?? undefined
    const search = url.searchParams.get('search') ?? undefined
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
      limit: 500,
      before,
    })

    const body = merged.items
      .map((item) => formatExportLine(item.createdAt, item.level, item.domain, item.message))
      .join('\n')

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="whatsapp-assistant-logs.txt"',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export logs'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
