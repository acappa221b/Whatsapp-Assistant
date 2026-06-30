import { describe, expect, it } from 'vitest'
import { checkRuntimeIntegrity, WHATSAPP_RUNTIME_VERSION } from './runtime-integrity'

describe('runtime-integrity (RC-05)', () => {
  it('reports valid when all required keys present', () => {
    const runtime = {
      eventBus: {},
      provider: {},
      messageRepository: {},
      chatConfigRepository: {},
      storeUseCase: {},
      listUseCase: {},
      listChatArchiveUseCase: {},
      metricsUseCase: {},
      markProcessedUseCase: {},
      ensureChatDiscoveredUseCase: {},
      backfillNamesUseCase: {},
      listChatConfigsUseCase: {},
      listChatConfigsPaginatedUseCase: {},
      pruneOrphanChatConfigsUseCase: {},
      updateChatConfigUseCase: {},
      deleteChatHistoryUseCase: {},
      resolveChatNamesUseCase: {},
      fidelityUseCase: {},
      contactNameResolver: {},
    }
    const health = checkRuntimeIntegrity(runtime)
    expect(health.valid).toBe(true)
    expect(health.missing).toEqual([])
    expect(health.version).toBe(WHATSAPP_RUNTIME_VERSION)
  })

  it('reports missing listChatArchiveUseCase (stale runtime)', () => {
    const stale = {
      eventBus: {},
      provider: {},
      messageRepository: {},
      chatConfigRepository: {},
      storeUseCase: {},
      listUseCase: {},
      metricsUseCase: {},
      markProcessedUseCase: {},
      ensureChatDiscoveredUseCase: {},
      listChatConfigsUseCase: {},
      updateChatConfigUseCase: {},
    }
    const health = checkRuntimeIntegrity(stale)
    expect(health.valid).toBe(false)
    expect(health.missing).toContain('listChatArchiveUseCase')
  })
})
