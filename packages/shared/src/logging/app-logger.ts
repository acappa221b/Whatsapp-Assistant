export type AppLogLevel = 'debug' | 'info' | 'warn' | 'error'

export type AppLogDomain =
  | 'system'
  | 'launcher'
  | 'whatsapp'
  | 'api'
  | 'ai'
  | 'assistant'
  | 'database'
  | 'jobs'

export type AppLogEntry = {
  level: AppLogLevel
  domain: AppLogDomain
  message: string
  metadata?: Record<string, unknown>
  source?: 'app' | 'launcher'
}

export type AppLogSink = (entry: AppLogEntry) => Promise<void> | void

const SECRET_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bsk-[A-Za-z0-9_-]{8,}\b/g, replacement: 'sk-****' },
  { pattern: /\bAIza[A-Za-z0-9_-]{20,}\b/g, replacement: 'AIza****' },
  { pattern: /Bearer\s+[A-Za-z0-9._-]+/gi, replacement: 'Bearer ****' },
  { pattern: /("apiKey"\s*:\s*")[^"]+(")/gi, replacement: '$1****$2' },
  { pattern: /(apiKey=)[^&\s]+/gi, replacement: '$1****' },
]

export function sanitizeLogMessage(text: string): string {
  let sanitized = text
  for (const { pattern, replacement } of SECRET_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement)
  }
  return sanitized
}

export function inferDomainFromMessage(message: string): AppLogDomain {
  const lower = message.toLowerCase()
  if (lower.includes('[baileys]') || lower.includes('[whatsapp') || lower.includes('whatsapp/')) {
    return 'whatsapp'
  }
  if (lower.includes('[assistant') || lower.includes('assistant/')) {
    return 'assistant'
  }
  if (lower.includes('[dailyreport]') || lower.includes('[jobs]') || lower.includes('pipeline')) {
    return 'jobs'
  }
  if (lower.includes('[settings/') || lower.includes('/api/') || lower.includes('[api]')) {
    return 'api'
  }
  if (lower.includes('openai') || lower.includes('gemini') || lower.includes('whisper') || lower.includes('[ai]') || lower.includes('[agentchat]')) {
    return 'ai'
  }
  if (lower.includes('prisma') || lower.includes('[database]') || lower.includes('sqlite')) {
    return 'database'
  }
  if (lower.includes('launcher') || lower.includes('[launch]')) {
    return 'launcher'
  }
  return 'system'
}

function inferLevelFromLauncherMessage(message: string): AppLogLevel {
  const lower = message.toLowerCase()
  if (lower.includes('error') || lower.includes('failed') || lower.includes('exited with')) {
    return 'error'
  }
  if (lower.includes('warn')) return 'warn'
  return 'info'
}

export function inferLauncherLogLevel(message: string): AppLogLevel {
  return inferLevelFromLauncherMessage(message)
}

export function serializeLogMetadata(metadata?: Record<string, unknown>): string | null {
  if (!metadata || Object.keys(metadata).length === 0) return null
  try {
    return sanitizeLogMessage(JSON.stringify(metadata))
  } catch {
    return null
  }
}

/** Skip Prisma engine noise and AppLog self-writes (prevents feedback loop). */
export function shouldPersistConsoleMessage(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return false
  if (/^prisma:/i.test(trimmed)) return false
  if (/\bAppLog\b/i.test(trimmed) && /\b(INSERT|DELETE|SELECT|UPDATE)\b/i.test(trimmed)) {
    return false
  }
  return true
}

export function normalizeConsoleArgs(args: unknown[]): { message: string; metadata?: Record<string, unknown> } {
  if (args.length === 0) return { message: '' }

  const parts: string[] = []
  const objects: unknown[] = []

  for (const arg of args) {
    if (typeof arg === 'string') {
      parts.push(arg)
    } else if (arg instanceof Error) {
      parts.push(arg.message)
      objects.push({ name: arg.name, stack: arg.stack })
    } else if (typeof arg === 'object' && arg !== null) {
      objects.push(arg)
    } else {
      parts.push(String(arg))
    }
  }

  const message = sanitizeLogMessage(parts.join(' ').trim() || (objects[0] ? JSON.stringify(objects[0]) : ''))
  const metadata =
    objects.length === 1 && typeof objects[0] === 'object' && objects[0] !== null
      ? (objects[0] as Record<string, unknown>)
      : objects.length > 0
        ? { details: objects }
        : undefined

  return { message, metadata }
}

let registeredSink: AppLogSink | null = null

export function registerAppLogSink(sink: AppLogSink | null): void {
  registeredSink = sink
}

export function createAppLogger(sink?: AppLogSink) {
  const effectiveSink = sink ?? registeredSink

  function log(entry: AppLogEntry): void {
    const sanitized: AppLogEntry = {
      ...entry,
      message: sanitizeLogMessage(entry.message),
      metadata: entry.metadata
        ? (JSON.parse(sanitizeLogMessage(JSON.stringify(entry.metadata))) as Record<string, unknown>)
        : undefined,
      source: entry.source ?? 'app',
    }

    if (effectiveSink) {
      void Promise.resolve(effectiveSink(sanitized)).catch(() => {
        // sink failures must not break app
      })
    }
  }

  return {
    debug(message: string, metadata?: Record<string, unknown>) {
      log({ level: 'debug', domain: inferDomainFromMessage(message), message, metadata, source: 'app' })
    },
    info(message: string, metadata?: Record<string, unknown>) {
      log({ level: 'info', domain: inferDomainFromMessage(message), message, metadata, source: 'app' })
    },
    warn(message: string, metadata?: Record<string, unknown>) {
      log({ level: 'warn', domain: inferDomainFromMessage(message), message, metadata, source: 'app' })
    },
    error(message: string, metadata?: Record<string, unknown>) {
      log({ level: 'error', domain: inferDomainFromMessage(message), message, metadata, source: 'app' })
    },
    log,
  }
}

let sharedLogger: ReturnType<typeof createAppLogger> | null = null

export function getSharedAppLogger() {
  if (!sharedLogger) {
    sharedLogger = createAppLogger()
  }
  return sharedLogger
}
