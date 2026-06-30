import type { AppLogLevel, PrismaClient } from '@prisma/client'

export type AppLogRecord = {
  id: string
  level: AppLogLevel
  domain: string
  message: string
  metadata: string | null
  source: string
  createdAt: Date
}

export type AppendAppLogInput = {
  level: AppLogLevel
  domain: string
  message: string
  metadata?: string | null
  source?: string
}

export type ListAppLogsQuery = {
  level?: AppLogLevel | AppLogLevel[]
  domain?: string
  search?: string
  limit?: number
  before?: Date
}

export type CountAppLogsQuery = {
  level?: AppLogLevel | AppLogLevel[]
}

let lastPruneAt = 0
const PRUNE_DEBOUNCE_MS = 60_000

export class AppLogPrismaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(input: AppendAppLogInput): Promise<AppLogRecord> {
    const saved = await this.prisma.appLog.create({
      data: {
        level: input.level,
        domain: input.domain,
        message: input.message,
        metadata: input.metadata ?? null,
        source: input.source ?? 'app',
      },
    })
    void this.maybePrune()
    return this.map(saved)
  }

  async appendMany(inputs: AppendAppLogInput[]): Promise<number> {
    if (inputs.length === 0) return 0
    const result = await this.prisma.appLog.createMany({
      data: inputs.map((input) => ({
        level: input.level,
        domain: input.domain,
        message: input.message,
        metadata: input.metadata ?? null,
        source: input.source ?? 'app',
      })),
    })
    void this.maybePrune()
    return result.count
  }

  async list(query: ListAppLogsQuery = {}): Promise<AppLogRecord[]> {
    const limit = Math.min(Math.max(query.limit ?? 200, 1), 500)
    const where = this.buildWhere(query)
    const rows = await this.prisma.appLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map((row) => this.map(row))
  }

  async count(query: CountAppLogsQuery = {}): Promise<number> {
    return this.prisma.appLog.count({ where: this.buildWhere(query) })
  }

  async clear(): Promise<number> {
    const result = await this.prisma.appLog.deleteMany()
    return result.count
  }

  async prune(maxRows = 5000, maxAgeDays = 7): Promise<void> {
    const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000)
    await this.prisma.appLog.deleteMany({ where: { createdAt: { lt: cutoff } } })

    const count = await this.prisma.appLog.count()
    if (count <= maxRows) return

    const excess = count - maxRows
    const oldest = await this.prisma.appLog.findMany({
      orderBy: { createdAt: 'asc' },
      take: excess,
      select: { id: true },
    })
    if (oldest.length === 0) return
    await this.prisma.appLog.deleteMany({
      where: { id: { in: oldest.map((row) => row.id) } },
    })
  }

  private async maybePrune(): Promise<void> {
    const now = Date.now()
    if (now - lastPruneAt < PRUNE_DEBOUNCE_MS) return
    lastPruneAt = now
    try {
      await this.prune()
    } catch {
      // retention must not break logging
    }
  }

  private buildWhere(query: ListAppLogsQuery | CountAppLogsQuery) {
    const where: {
      level?: AppLogLevel | { in: AppLogLevel[] }
      domain?: string
      message?: { contains: string }
      createdAt?: { lt: Date }
    } = {}

    if (query.level) {
      where.level = Array.isArray(query.level) ? { in: query.level } : query.level
    }
    if ('domain' in query && query.domain) {
      where.domain = query.domain
    }
    if ('search' in query && query.search?.trim()) {
      where.message = { contains: query.search.trim() }
    }
    if ('before' in query && query.before) {
      where.createdAt = { lt: query.before }
    }
    return where
  }

  private map(row: {
    id: string
    level: AppLogLevel
    domain: string
    message: string
    metadata: string | null
    source: string
    createdAt: Date
  }): AppLogRecord {
    return {
      id: row.id,
      level: row.level,
      domain: row.domain,
      message: row.message,
      metadata: row.metadata,
      source: row.source,
      createdAt: row.createdAt,
    }
  }
}
