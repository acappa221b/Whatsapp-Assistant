/** Bump when WhatsappRuntime shape changes — invalidates stale global singleton. */
export const WHATSAPP_RUNTIME_VERSION = 8

export type RuntimeHealth = {
  valid: boolean
  version: number
  missing: string[]
}

export type RuntimeIntegrityTarget = {
  eventBus: unknown
  provider: unknown
  messageRepository: unknown
  chatConfigRepository: unknown
  storeUseCase: unknown
  listUseCase: unknown
  listChatArchiveUseCase: unknown
  metricsUseCase: unknown
  markProcessedUseCase: unknown
  ensureChatDiscoveredUseCase: unknown
  backfillNamesUseCase: unknown
  listChatConfigsUseCase: unknown
  updateChatConfigUseCase: unknown
  deleteChatHistoryUseCase: unknown
  resolveChatNamesUseCase: unknown
  fidelityUseCase: unknown
  contactNameResolver: unknown
}

const REQUIRED_KEYS: (keyof RuntimeIntegrityTarget)[] = [
  'eventBus',
  'provider',
  'messageRepository',
  'chatConfigRepository',
  'storeUseCase',
  'listUseCase',
  'listChatArchiveUseCase',
  'metricsUseCase',
  'markProcessedUseCase',
  'ensureChatDiscoveredUseCase',
  'backfillNamesUseCase',
  'listChatConfigsUseCase',
  'updateChatConfigUseCase',
  'deleteChatHistoryUseCase',
  'resolveChatNamesUseCase',
  'fidelityUseCase',
  'contactNameResolver',
]

export function checkRuntimeIntegrity(runtime: Partial<RuntimeIntegrityTarget>): RuntimeHealth {
  const missing = REQUIRED_KEYS.filter((key) => runtime[key] == null)

  return {
    valid: missing.length === 0,
    version: WHATSAPP_RUNTIME_VERSION,
    missing,
  }
}
