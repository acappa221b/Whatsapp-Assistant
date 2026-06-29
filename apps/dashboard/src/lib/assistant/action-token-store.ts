import { randomUUID } from 'node:crypto'
import type { AssistantPreview } from '@finance-ai/core/domains/assistant-ops'

type StoredAction = AssistantPreview & {
  createdAt: number
  used: boolean
  originalMessage: string
}

const TTL_MS = 5 * 60 * 1000
const store = new Map<string, StoredAction>()

export function createActionToken(preview: AssistantPreview, originalMessage: string): string {
  const token = randomUUID()
  store.set(token, { ...preview, createdAt: Date.now(), used: false, originalMessage })
  return token
}

export function consumeActionToken(token: string): AssistantPreview | null {
  const entry = store.get(token)
  if (!entry || entry.used) return null
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(token)
    return null
  }
  entry.used = true
  return {
    action: entry.action,
    text: entry.text,
    targets: entry.targets,
    warnings: entry.warnings,
    needsExtraConfirm: entry.needsExtraConfirm,
  }
}

export function peekActionToken(token: string): AssistantPreview | null {
  const entry = store.get(token)
  if (!entry || entry.used) return null
  if (Date.now() - entry.createdAt > TTL_MS) {
    store.delete(token)
    return null
  }
  return {
    action: entry.action,
    text: entry.text,
    targets: entry.targets,
    warnings: entry.warnings,
    needsExtraConfirm: entry.needsExtraConfirm,
  }
}
