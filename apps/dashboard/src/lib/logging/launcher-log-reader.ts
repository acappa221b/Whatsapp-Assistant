import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { REPO_ROOT } from '@finance-ai/shared/config'
import {
  inferDomainFromMessage,
  inferLauncherLogLevel,
  sanitizeLogMessage,
  type AppLogLevel,
} from '@finance-ai/shared/logging'

export type UnifiedLogItem = {
  id: string
  level: AppLogLevel
  domain: string
  message: string
  metadata: Record<string, unknown> | null
  source: 'app' | 'launcher'
  createdAt: string
}

const LAUNCHER_LINE_RE = /^\[([^\]]+)\]\s*(.*)$/
const DEFAULT_LAUNCHER_PATH = resolve(REPO_ROOT, 'logs/launcher.log')
const MAX_LAUNCHER_LINES = 500

export function parseLauncherLogLine(line: string, index: number): UnifiedLogItem | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  const match = trimmed.match(LAUNCHER_LINE_RE)
  if (!match) return null

  const [, iso, rawMessage] = match
  const createdAt = new Date(iso ?? '')
  if (Number.isNaN(createdAt.getTime())) return null

  const message = sanitizeLogMessage(rawMessage ?? '')
  return {
    id: `launcher:${index}:${createdAt.getTime()}`,
    level: inferLauncherLogLevel(message),
    domain: 'launcher',
    message,
    metadata: null,
    source: 'launcher',
    createdAt: createdAt.toISOString(),
  }
}

export function readLauncherLogs(filePath = DEFAULT_LAUNCHER_PATH): UnifiedLogItem[] {
  if (!existsSync(filePath)) return []

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split(/\r?\n/).slice(-MAX_LAUNCHER_LINES)

  const items: UnifiedLogItem[] = []
  for (let i = 0; i < lines.length; i++) {
    const parsed = parseLauncherLogLine(lines[i] ?? '', i)
    if (parsed) items.push(parsed)
  }
  return items
}

export function mapDbLogToUnified(row: {
  id: string
  level: string
  domain: string
  message: string
  metadata: string | null
  source: string
  createdAt: Date
}): UnifiedLogItem {
  let metadata: Record<string, unknown> | null = null
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>
    } catch {
      metadata = null
    }
  }

  return {
    id: row.id,
    level: row.level as AppLogLevel,
    domain: row.domain,
    message: row.message,
    metadata,
    source: row.source === 'launcher' ? 'launcher' : 'app',
    createdAt: row.createdAt.toISOString(),
  }
}

export function mergeLogItems(
  dbItems: UnifiedLogItem[],
  launcherItems: UnifiedLogItem[],
  options: {
    level?: 'all' | 'error' | 'warn'
    domain?: string
    search?: string
    limit: number
    before?: Date
  },
): { items: UnifiedLogItem[]; hasMore: boolean; nextBefore: string | null } {
  const searchLower = options.search?.trim().toLowerCase()

  const filtered = [...dbItems, ...launcherItems].filter((item) => {
    if (options.before && new Date(item.createdAt) >= options.before) return false
    if (options.level === 'error' && item.level !== 'error') return false
    if (options.level === 'warn' && item.level !== 'warn' && item.level !== 'error') return false
    if (options.domain && item.domain !== options.domain) return false
    if (searchLower && !item.message.toLowerCase().includes(searchLower)) return false
    return true
  })

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const items = filtered.slice(0, options.limit)
  const hasMore = filtered.length > options.limit
  const nextBefore = hasMore && items.length > 0 ? items[items.length - 1]!.createdAt : null

  return { items, hasMore, nextBefore }
}

export function inferDomainFromLauncherMessage(message: string): string {
  return inferDomainFromMessage(message)
}
