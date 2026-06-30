import type { AppLogPrismaRepository } from '@finance-ai/database'
import {
  createAppLogger,
  registerAppLogSink,
  serializeLogMetadata,
  type AppLogEntry,
  type AppLogSink,
} from '@finance-ai/shared/logging'

const pendingQueue: AppLogEntry[] = []
const writeQueue: AppLogEntry[] = []
let sinkReady = false
let flushingPending = false
let internalWrite = false
let flushTimer: ReturnType<typeof setTimeout> | null = null
let logRepo: AppLogPrismaRepository | null = null
let logRepoPromise: Promise<AppLogPrismaRepository> | null = null

const FLUSH_DEBOUNCE_MS = 150
const MAX_WRITE_QUEUE = 200

async function getLogRepo(): Promise<AppLogPrismaRepository> {
  if (logRepo) return logRepo
  if (!logRepoPromise) {
    logRepoPromise = import('@finance-ai/database').then(({ prisma, AppLogPrismaRepository }) => {
      logRepo = new AppLogPrismaRepository(prisma)
      return logRepo
    })
  }
  return logRepoPromise
}

export function isInternalLogWrite(): boolean {
  return internalWrite
}

async function flushWriteQueue(): Promise<void> {
  if (!sinkReady || internalWrite || writeQueue.length === 0) return

  const batch = writeQueue.splice(0, 50)
  internalWrite = true
  try {
    const repo = await getLogRepo()
    await repo.appendMany(
      batch.map((entry) => ({
        level: entry.level,
        domain: entry.domain,
        message: entry.message,
        metadata: serializeLogMetadata(entry.metadata),
        source: entry.source ?? 'app',
      })),
    )
  } catch {
    // logging must never break the app
  } finally {
    internalWrite = false
    if (writeQueue.length > 0) {
      scheduleFlush()
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushWriteQueue()
  }, FLUSH_DEBOUNCE_MS)
}

const sink: AppLogSink = (entry) => {
  if (!sinkReady) {
    pendingQueue.push(entry)
    if (pendingQueue.length > MAX_WRITE_QUEUE) pendingQueue.shift()
    return
  }
  writeQueue.push(entry)
  if (writeQueue.length > MAX_WRITE_QUEUE) writeQueue.shift()
  scheduleFlush()
}

const logger = createAppLogger(sink)
registerAppLogSink(sink)

export function getAppLogger() {
  return logger
}

export async function flushPendingAppLogs(): Promise<void> {
  if (flushingPending) return
  flushingPending = true
  sinkReady = true
  try {
    const { drainConsoleLogQueue } = await import('@/lib/logging/console-hook')
    for (const entry of drainConsoleLogQueue()) {
      writeQueue.push(entry)
    }
    while (pendingQueue.length > 0) {
      const entry = pendingQueue.shift()
      if (!entry) break
      writeQueue.push(entry)
    }
    await flushWriteQueue()
  } finally {
    flushingPending = false
  }
}

export async function initializeAppLogSink(): Promise<void> {
  sinkReady = true
  await flushPendingAppLogs()
}

export async function getAppLogRepository(): Promise<AppLogPrismaRepository> {
  return getLogRepo()
}
