export type SyncPhase = 'idle' | 'history' | 'bootstrap' | 'live'
export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error'

export type SyncedContactEntry = {
  chatId: string
  name: string | null
  source:
    | 'messaging-history'
    | 'chats.upsert'
    | 'groups.upsert'
    | 'contacts.upsert'
    | 'message'
    | 'bootstrap'
  at: string
}

export type ContactSyncSnapshot = {
  status: SyncStatus
  phase: SyncPhase
  processed: number
  recent: SyncedContactEntry[]
  startedAt: string | null
  completedAt: string | null
  lastError: string | null
  message: string | null
}

type InternalSyncState = ContactSyncSnapshot & {
  lastRecordAt: string | null
  connectedAt: string | null
  seenChatIds: Set<string>
}

const STALE_SYNC_MS = 60_000
const EMPTY_IDLE_MS = 15_000

const globalKey = '__dashboardContactSyncTracker__' as const

function createInitialState(): InternalSyncState {
  return {
    status: 'idle',
    phase: 'idle',
    processed: 0,
    recent: [],
    startedAt: null,
    completedAt: null,
    lastError: null,
    message: null,
    lastRecordAt: null,
    connectedAt: null,
    seenChatIds: new Set(),
  }
}

function getState(): InternalSyncState {
  const g = globalThis as unknown as Record<string, InternalSyncState | undefined>
  if (!g[globalKey]) {
    g[globalKey] = createInitialState()
  }
  return g[globalKey]!
}

function toSnapshot(state: InternalSyncState): ContactSyncSnapshot {
  return {
    status: state.status,
    phase: state.phase,
    processed: state.processed,
    recent: state.recent,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    lastError: state.lastError,
    message: state.message,
  }
}

function applyTimeoutRules(state: InternalSyncState): InternalSyncState {
  if (state.status === 'completed' || state.status === 'error') {
    return state
  }

  const now = Date.now()

  if (state.status === 'syncing' && state.lastRecordAt) {
    const staleMs = now - new Date(state.lastRecordAt).getTime()
    if (staleMs > STALE_SYNC_MS) {
      return {
        ...state,
        status: 'completed',
        phase: 'live',
        completedAt: new Date().toISOString(),
        message: 'Sincronização lenta — novos chats aparecem quando houver mensagens',
      }
    }
  }

  if (
    state.status === 'syncing' &&
    state.processed === 0 &&
    state.connectedAt &&
    !state.lastRecordAt
  ) {
    const idleMs = now - new Date(state.connectedAt).getTime()
    if (idleMs > EMPTY_IDLE_MS) {
      return {
        ...state,
        status: 'completed',
        phase: 'live',
        completedAt: new Date().toISOString(),
        message: 'Nenhum contato novo. Chats surgem ao receber ou enviar mensagens.',
      }
    }
  }

  return state
}

export function startSync(phase: SyncPhase, message?: string): void {
  const state = getState()
  state.status = 'syncing'
  state.phase = phase
  state.message = message ?? state.message
  if (!state.startedAt) {
    state.startedAt = new Date().toISOString()
  }
  if (!state.connectedAt) {
    state.connectedAt = new Date().toISOString()
  }
  state.completedAt = null
  state.lastError = null
}

export function recordSyncedContact(entry: Omit<SyncedContactEntry, 'at'>): void {
  const state = getState()
  const at = new Date().toISOString()
  const full: SyncedContactEntry = { ...entry, at }

  if (!state.seenChatIds.has(entry.chatId)) {
    state.seenChatIds.add(entry.chatId)
    state.processed += 1
  }

  state.recent = [full, ...state.recent.filter((row) => row.chatId !== entry.chatId)].slice(0, 20)
  state.lastRecordAt = at
  if (state.status === 'idle') {
    state.status = 'syncing'
  }
}

export function completeSync(message?: string): void {
  const state = getState()
  state.status = 'completed'
  state.phase = 'live'
  state.completedAt = new Date().toISOString()
  if (message) state.message = message
}

export function failSync(error: string): void {
  const state = getState()
  state.status = 'error'
  state.lastError = error
  state.completedAt = new Date().toISOString()
}

export function getContactSyncSnapshot(): ContactSyncSnapshot {
  const state = applyTimeoutRules(getState())
  const g = globalThis as unknown as Record<string, InternalSyncState | undefined>
  g[globalKey] = state
  return toSnapshot(state)
}

export function resetSyncOnDisconnect(): void {
  const g = globalThis as unknown as Record<string, InternalSyncState | undefined>
  g[globalKey] = createInitialState()
}

export function resetSyncStateForManualRun(): void {
  const state = getState()
  state.processed = 0
  state.recent = []
  state.seenChatIds.clear()
  state.status = 'syncing'
  state.phase = 'bootstrap'
  state.message = 'Sincronizando contatos…'
  state.startedAt = new Date().toISOString()
  state.completedAt = null
  state.lastError = null
  state.lastRecordAt = null
}

export function markWhatsappConnected(): void {
  const state = getState()
  if (!state.connectedAt) {
    state.connectedAt = new Date().toISOString()
  }
}
