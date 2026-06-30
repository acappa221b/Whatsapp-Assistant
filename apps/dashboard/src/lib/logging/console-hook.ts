import {
  inferDomainFromMessage,
  normalizeConsoleArgs,
  shouldPersistConsoleMessage,
  type AppLogEntry,
  type AppLogLevel,
} from '@finance-ai/shared/logging'

let installed = false
let persisting = false

/** Buffered until initializeAppLogSink() drains into SQLite. */
const earlyQueue: AppLogEntry[] = []
const MAX_EARLY_QUEUE = 500

const original = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
}

export function drainConsoleLogQueue(): AppLogEntry[] {
  if (earlyQueue.length === 0) return []
  return earlyQueue.splice(0, earlyQueue.length)
}

function persistFromConsole(level: AppLogLevel, args: unknown[]): void {
  if (persisting) return

  const { message, metadata } = normalizeConsoleArgs(args)
  if (!shouldPersistConsoleMessage(message)) return

  persisting = true
  try {
    earlyQueue.push({
      level,
      domain: inferDomainFromMessage(message),
      message,
      metadata,
      source: 'app',
    })
    if (earlyQueue.length > MAX_EARLY_QUEUE) earlyQueue.shift()
  } finally {
    persisting = false
  }
}

export function installConsoleLogHook(): void {
  if (installed) return
  installed = true

  console.log = (...args: unknown[]) => {
    original.log(...args)
    persistFromConsole('info', args)
  }
  console.info = (...args: unknown[]) => {
    original.info(...args)
    persistFromConsole('info', args)
  }
  console.warn = (...args: unknown[]) => {
    original.warn(...args)
    persistFromConsole('warn', args)
  }
  console.error = (...args: unknown[]) => {
    original.error(...args)
    persistFromConsole('error', args)
  }
  console.debug = (...args: unknown[]) => {
    original.debug(...args)
    persistFromConsole('debug', args)
  }
}

export function isConsoleLogHookInstalled(): boolean {
  return installed
}
