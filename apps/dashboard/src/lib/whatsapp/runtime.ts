import { config } from '@finance-ai/shared/config'
import { randomUUID } from 'node:crypto'
import { ChatIdentityResolver, AUDIO_PENDING_CONTENT } from '@finance-ai/shared/utils'
import { InMemoryEventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import {
  AgentAutoReplyPipeline,
  AgentOutboundTracker,
  AgentReplyDeduplicator,
  getAgentReplyDiagnostics,
  HandleHumanTakeoverUseCase,
  PauseAgentAfterDeferralUseCase,
  ProcessAgentAutoReplyUseCase,
} from '@finance-ai/core/domains/agent-chat'
import { RecordApiTokenUsageUseCase } from '@finance-ai/core/domains/api-token-usage'
import { MediaProcessingPipeline } from '@finance-ai/core/domains/message-processing'
import { TranscribeAudioUseCase, RetryPendingAudioTranscriptionsUseCase } from '@finance-ai/core/domains/audio-transcription'
import { ProcessPhotoUseCase } from '@finance-ai/core/domains/photo-processing'
import type { AgentChatProvider } from '@finance-ai/core/domains/agent-chat'
import { MediaDownloader } from '@finance-ai/whatsapp/media'
import {
  createAgentChatProvider,
  getUnifiedProvider,
  hasAiProvider,
  settingsRepo,
} from '@/lib/ai/ai-provider-service'
import {
  composeAgentPromptUseCase,
  getDefaultPersona,
  searchKnowledgeUseCase,
} from '@/lib/ai-training/ai-training-service'
import {
  BackfillWhatsappMessageNamesUseCase,
  DeleteChatHistoryUseCase,
  GetMessageArchiveMetricsUseCase,
  GetMessageFidelityMetricsUseCase,
  ListWhatsappChatArchiveUseCase,
  ListWhatsappMessagesUseCase,
  MarkWhatsappMessageProcessedUseCase,
  StoreWhatsappMessageUseCase,
} from '@finance-ai/core/domains/whatsapp-message'
import {
  EnsureWhatsappChatDiscoveredUseCase,
  ListWhatsappChatConfigsUseCase,
  ListWhatsappChatConfigsPaginatedUseCase,
  PruneOrphanChatConfigsUseCase,
  ResolveChatNamesUseCase,
  UpdateWhatsappChatConfigUseCase,
} from '@finance-ai/core/domains/whatsapp-chat-config'
import {
  prisma,
  WhatsappChatConfigPrismaRepository,
  WhatsappMessagePrismaRepository,
  ApiTokenUsagePrismaRepository,
} from '@finance-ai/database'
import {
  BaileysWhatsappProvider,
  ContactNameResolver,
  getMessageCaptureMetrics,
  getOwnJidFromAuthSession,
  isValidAuthSession,
  WhatsappConnectionPipeline,
  WhatsappMessagePipeline,
  type IncomingMessage,
  type WhatsappProvider,
  type WhatsappStatus,
} from '@finance-ai/whatsapp'

import {
  checkRuntimeIntegrity,
  WHATSAPP_RUNTIME_VERSION,
  type RuntimeHealth,
} from './runtime-integrity'
import { buildArchiveHealthSnapshot } from '@finance-ai/core/domains/message-archive'
import { bootstrapWhatsappNames } from './name-bootstrap'
import { loadWhatsappDiscoveryPolicy } from './discovery-policy'
import type { WhatsappDiscoveryPolicy } from '@finance-ai/shared'
import { repairHistoricalMessages } from './repair-historical-messages'
import { deleteStoredMediaFile, createChatMediaCleanup } from '@/lib/media-storage'
import { createChatNameResolverPort } from './chat-name-resolution.adapter'
import { ChatMediaStorage } from '@finance-ai/shared/storage'
import { registerDailyReportJob } from '@/lib/jobs/daily-report.job'
import {
  completeSync,
  failSync,
  getContactSyncSnapshot,
  markWhatsappConnected,
  recordSyncedContact,
  resetSyncOnDisconnect,
  resetSyncStateForManualRun,
  startSync,
  type SyncedContactEntry,
} from './contact-sync-tracker'

export { WHATSAPP_RUNTIME_VERSION, checkRuntimeIntegrity, type RuntimeHealth } from './runtime-integrity'

function logRc02EventBusPublish(name: string, payload: Record<string, unknown>): void {
  console.info('[RC-02/EVENT_BUS_PUBLISH]', {
    at: new Date().toISOString(),
    name,
    ...payload,
  })
}

type WhatsappRuntime = {
  eventBus: InMemoryEventBus
  provider: WhatsappProvider
  messageRepository: WhatsappMessagePrismaRepository
  chatConfigRepository: WhatsappChatConfigPrismaRepository
  storeUseCase: StoreWhatsappMessageUseCase
  listUseCase: ListWhatsappMessagesUseCase
  listChatArchiveUseCase: ListWhatsappChatArchiveUseCase
  metricsUseCase: GetMessageArchiveMetricsUseCase
  markProcessedUseCase: MarkWhatsappMessageProcessedUseCase
  ensureChatDiscoveredUseCase: EnsureWhatsappChatDiscoveredUseCase
  backfillNamesUseCase: BackfillWhatsappMessageNamesUseCase
  listChatConfigsUseCase: ListWhatsappChatConfigsUseCase
  listChatConfigsPaginatedUseCase: ListWhatsappChatConfigsPaginatedUseCase
  pruneOrphanChatConfigsUseCase: PruneOrphanChatConfigsUseCase
  updateChatConfigUseCase: UpdateWhatsappChatConfigUseCase
  deleteChatHistoryUseCase: DeleteChatHistoryUseCase
  resolveChatNamesUseCase: ResolveChatNamesUseCase
  fidelityUseCase: GetMessageFidelityMetricsUseCase
  contactNameResolver: ContactNameResolver
  runContactBootstrap: () => Promise<void>
}

export type WhatsappOperationalStatus = {
  status: WhatsappStatus['status']
  connected: boolean
  authenticated: boolean
  sessionLoaded: boolean
  qrCode: string | null
  qrCodeDataUrl: string | null
  lastConnectedAt: string | null
  messageCount: number
  liveMessageCount: number
  chatCount: number
  groupCount: number
  lastMessageAt: string | null
  lastEventAt: string | null
  lastEventName: string | null
  operationalMessage: string | null
}

type StatusListener = (status: WhatsappStatus) => void

const globalForWhatsapp = globalThis as unknown as {
  whatsappRuntime?: WhatsappRuntime
  whatsappRuntimeVersion?: number
  whatsappStatusListeners?: Set<StatusListener>
  whatsappPipelinesRegistered?: boolean
  registeredPipelineEventBus?: InMemoryEventBus
  pipelineCleanup?: () => void
  whatsappBootstrapPromise?: Promise<void>
  transcribeAudioUseCase?: TranscribeAudioUseCase
  retryPendingAudioTranscriptionsUseCase?: RetryPendingAudioTranscriptionsUseCase
  processAgentAutoReplyUseCase?: ProcessAgentAutoReplyUseCase
  whatsappOperational?: {
    sessionLoaded: boolean
    lastMessageAt: Date | null
    lastEventAt: Date | null
    lastEventName: string | null
  }
  nameBootstrapDone?: boolean
}

function getOperationalState() {
  if (!globalForWhatsapp.whatsappOperational) {
    globalForWhatsapp.whatsappOperational = {
      sessionLoaded: isValidAuthSession(config.whatsapp.sessionPath),
      lastMessageAt: null,
      lastEventAt: null,
      lastEventName: null,
    }
  }
  return globalForWhatsapp.whatsappOperational
}

function recordOperationalEvent(eventName: string): void {
  const state = getOperationalState()
  state.lastEventAt = new Date()
  state.lastEventName = eventName
}

function createRuntime(): WhatsappRuntime {
  console.info('[RUNTIME_INIT]', {
    at: new Date().toISOString(),
    version: WHATSAPP_RUNTIME_VERSION,
  })
  const eventBus = new InMemoryEventBus()
  const messageRepository = new WhatsappMessagePrismaRepository(prisma)
  const chatConfigRepository = new WhatsappChatConfigPrismaRepository(prisma)
  const ensureChatDiscoveredUseCase = new EnsureWhatsappChatDiscoveredUseCase(chatConfigRepository)
  const executeEnsureChatDiscovered = ensureChatDiscoveredUseCase.execute.bind(ensureChatDiscoveredUseCase)
  let historySyncActive = false
  let skipMessageSourceRecord = false

  const recordContactSynced = async (entry: Omit<SyncedContactEntry, 'at'>) => {
    recordSyncedContact(entry)
    const { getAppLogger } = await import('@/lib/logging/app-log-sink')
    const configRow = await chatConfigRepository.findByChatId(entry.chatId)
    getAppLogger().info('[whatsapp] Contato sincronizado', {
      chatId: entry.chatId,
      name: entry.name ?? null,
      source: entry.source,
      displayNumber: configRow?.displayNumber ?? null,
    })
  }

  ensureChatDiscoveredUseCase.execute = async (chatId: string, name?: string | null) => {
    const existed = await chatConfigRepository.findByChatId(chatId)
    const created = await executeEnsureChatDiscovered(chatId, name)
    if (!existed && !skipMessageSourceRecord) {
      await recordContactSynced({
        chatId,
        name: name?.trim() ?? null,
        source: 'message',
      })
    }
    return created
  }

  const backfillNamesUseCase = new BackfillWhatsappMessageNamesUseCase(messageRepository)
  const configNameCache = new Map<string, string>()
  let discoveryPolicy: WhatsappDiscoveryPolicy = {
    syncGroupsEnabled: false,
    syncAddressBookEnabled: false,
    syncChatsMetadataEnabled: false,
  }
  const chatsWithMessages = new Set<string>()

  const refreshDiscoveryPolicy = async () => {
    discoveryPolicy = await loadWhatsappDiscoveryPolicy(prisma)
  }

  const refreshChatsWithMessages = async () => {
    const rows = await prisma.whatsappMessage.findMany({
      distinct: ['chatId'],
      select: { chatId: true },
    })
    chatsWithMessages.clear()
    for (const row of rows) chatsWithMessages.add(row.chatId)
  }

  const shouldDiscoverChatConfig = async (chatId: string): Promise<boolean> => {
    const existing = await chatConfigRepository.findByChatId(chatId)
    if (existing) return true
    if (chatsWithMessages.has(chatId)) return true
    if (await chatConfigRepository.hasMessages(chatId)) {
      chatsWithMessages.add(chatId)
      return true
    }
    if (chatId.endsWith('@g.us')) return discoveryPolicy.syncGroupsEnabled
    return discoveryPolicy.syncChatsMetadataEnabled
  }

  const refreshConfigNameCache = async () => {
    const configs = await chatConfigRepository.findAll()
    configNameCache.clear()
    for (const config of configs) {
      if (config.name?.trim()) configNameCache.set(config.chatId, config.name.trim())
    }
  }

  const contactNameResolver = new ContactNameResolver({
    ownJid: getOwnJidFromAuthSession(config.whatsapp.sessionPath),
    chatNameLookup: (chatId) => configNameCache.get(chatId) ?? null,
    onGroupNameResolved: async (chatId, name) => {
      recordOperationalEvent('groups.metadata')
      configNameCache.set(chatId, name)
      if (!(await shouldDiscoverChatConfig(chatId))) return
      skipMessageSourceRecord = true
      try {
        await ensureChatDiscoveredUseCase.execute(chatId, name)
        await backfillNamesUseCase.execute({ chatId, chatName: name })
      } finally {
        skipMessageSourceRecord = false
      }
      await recordContactSynced({
        chatId,
        name,
        source: 'groups.upsert',
      })
    },
  })

  const handleNameDiscovered = async (chatId: string, name?: string | null) => {
    recordOperationalEvent('chats.upsert')
    const trimmed = name?.trim()
    if (trimmed) configNameCache.set(chatId, trimmed)
    if (!(await shouldDiscoverChatConfig(chatId))) return
    const source: SyncedContactEntry['source'] = historySyncActive
      ? 'messaging-history'
      : 'chats.upsert'
    skipMessageSourceRecord = true
    try {
      if (!trimmed) {
        await ensureChatDiscoveredUseCase.execute(chatId)
      } else {
        await ensureChatDiscoveredUseCase.execute(chatId, trimmed)
        await backfillNamesUseCase.execute({ chatId, chatName: trimmed })
      }
    } finally {
      skipMessageSourceRecord = false
    }
    await recordContactSynced({ chatId, name: trimmed ?? null, source })
  }

  const handleContactDiscovered = async (jid: string, name: string) => {
    recordOperationalEvent('contacts.upsert')
    await backfillNamesUseCase.execute({ senderId: jid, senderName: name })
    if (!jid.endsWith('@g.us')) {
      configNameCache.set(jid, name)
    }
    await recordContactSynced({
      chatId: jid,
      name,
      source: 'contacts.upsert',
    })
  }

  let nameBootstrapDone = globalForWhatsapp.nameBootstrapDone ?? false
  let audioRetryDone = false

  const chatMediaStorage = new ChatMediaStorage()
  const resolveChatNamesUseCase = new ResolveChatNamesUseCase(
    chatConfigRepository,
    createChatNameResolverPort(prisma, contactNameResolver),
  )

  const runContactBootstrap = async () => {
    markWhatsappConnected()
    startSync('bootstrap', 'Sincronizando contatos…')
    contactNameResolver.setOwnJid(getOwnJidFromAuthSession(config.whatsapp.sessionPath))
    await refreshDiscoveryPolicy()
    await refreshChatsWithMessages()
    await refreshConfigNameCache()
    await bootstrapWhatsappNames({
      prisma,
      resolver: contactNameResolver,
      ensureChatDiscovered: ensureChatDiscoveredUseCase,
      backfillNames: backfillNamesUseCase,
      resolveChatNames: resolveChatNamesUseCase,
      chatMediaStorage,
      discoveryPolicy,
    })
  }

  const handleConnectionOpen = async () => {
    if (nameBootstrapDone) return
    nameBootstrapDone = true
    globalForWhatsapp.nameBootstrapDone = true
    await runContactBootstrap()
    completeSync('Sincronização de contatos concluída')
    const ownJid = getOwnJidFromAuthSession(config.whatsapp.sessionPath)
    const repair = await repairHistoricalMessages({
      prisma,
      ownJid,
      sampleWrappers: true,
    })
    if (repair.contentRepaired > 0 || repair.chatsRenamed > 0) {
      console.info('[RC-07/repair-historical]', repair)
    }
    if (!audioRetryDone) {
      audioRetryDone = true
      const retryUseCase = globalForWhatsapp.retryPendingAudioTranscriptionsUseCase
      if (retryUseCase) {
        void retryUseCase.execute().catch((error) => {
          console.error('[RetryPendingAudioTranscriptions] failed on connect', error)
        })
      }
    }
  }

  const provider = new BaileysWhatsappProvider({
    contactNameResolver,
    onChatDiscovered: handleNameDiscovered,
    onContactDiscovered: handleContactDiscovered,
    onConnectionOpen: handleConnectionOpen,
    getImportHistoryEnabled: async () => {
      const settings = await prisma.appSettings.findUnique({ where: { id: 'default' } })
      return settings ? !settings.whatsappIgnoreHistory : false
    },
    getDiscoveryPolicy: async () => loadWhatsappDiscoveryPolicy(prisma),
    onHistorySyncProgress: (input) => {
      if (input.batchSize > 0) {
        startSync('history', 'Importando histórico do WhatsApp…')
      }
      if (input.isLatest) {
        historySyncActive = false
        completeSync('Histórico sincronizado')
      } else {
        historySyncActive = true
      }
    },
    shouldEnrichGroupMetadata: async (chatId) => {
      await refreshDiscoveryPolicy()
      if (discoveryPolicy.syncGroupsEnabled) return true
      const configRow = await chatConfigRepository.findByChatId(chatId)
      return configRow?.archiveEnabled ?? false
    },
  })

  const storeUseCase = new StoreWhatsappMessageUseCase(messageRepository, eventBus)
  const listUseCase = new ListWhatsappMessagesUseCase(messageRepository)
  const listChatArchiveUseCase = new ListWhatsappChatArchiveUseCase(messageRepository)
  const metricsUseCase = new GetMessageArchiveMetricsUseCase(messageRepository)
  const fidelityUseCase = new GetMessageFidelityMetricsUseCase(messageRepository)
  const markProcessedUseCase = new MarkWhatsappMessageProcessedUseCase(messageRepository, eventBus)
  const listChatConfigsUseCase = new ListWhatsappChatConfigsUseCase(chatConfigRepository)
  const listChatConfigsPaginatedUseCase = new ListWhatsappChatConfigsPaginatedUseCase(
    chatConfigRepository,
  )
  const pruneOrphanChatConfigsUseCase = new PruneOrphanChatConfigsUseCase(chatConfigRepository)
  const updateChatConfigUseCase = new UpdateWhatsappChatConfigUseCase(chatConfigRepository)
  const deleteChatHistoryUseCase = new DeleteChatHistoryUseCase(
    messageRepository,
    chatConfigRepository,
    createChatMediaCleanup(),
    eventBus,
  )

  return {
    eventBus,
    provider,
    messageRepository,
    chatConfigRepository,
    storeUseCase,
    listUseCase,
    listChatArchiveUseCase,
    metricsUseCase,
    markProcessedUseCase,
    ensureChatDiscoveredUseCase,
    backfillNamesUseCase,
    listChatConfigsUseCase,
    listChatConfigsPaginatedUseCase,
    pruneOrphanChatConfigsUseCase,
    updateChatConfigUseCase,
    deleteChatHistoryUseCase,
    resolveChatNamesUseCase,
    fidelityUseCase,
    contactNameResolver,
    runContactBootstrap,
  }
}

function invalidateRuntimeCache(reason: string, health?: RuntimeHealth): void {
  console.warn('[RUNTIME_INVALID]', {
    at: new Date().toISOString(),
    reason,
    version: globalForWhatsapp.whatsappRuntimeVersion,
    expectedVersion: WHATSAPP_RUNTIME_VERSION,
    missing: health?.missing ?? [],
  })
  globalForWhatsapp.whatsappRuntime = undefined
  globalForWhatsapp.whatsappRuntimeVersion = undefined
  globalForWhatsapp.whatsappPipelinesRegistered = false
  globalForWhatsapp.registeredPipelineEventBus = undefined
  globalForWhatsapp.pipelineCleanup?.()
  globalForWhatsapp.pipelineCleanup = undefined
  globalForWhatsapp.whatsappBootstrapPromise = undefined
  globalForWhatsapp.transcribeAudioUseCase = undefined
  globalForWhatsapp.retryPendingAudioTranscriptionsUseCase = undefined
  globalForWhatsapp.processAgentAutoReplyUseCase = undefined
}

function needsRuntimeRebuild(): boolean {
  if (!globalForWhatsapp.whatsappRuntime) return true
  if (globalForWhatsapp.whatsappRuntimeVersion !== WHATSAPP_RUNTIME_VERSION) return true
  const health = checkRuntimeIntegrity(globalForWhatsapp.whatsappRuntime)
  return !health.valid
}

export function getRuntimeHealth(): RuntimeHealth {
  if (!globalForWhatsapp.whatsappRuntime) {
    return { valid: false, version: WHATSAPP_RUNTIME_VERSION, missing: ['whatsappRuntime'] }
  }
  return checkRuntimeIntegrity(globalForWhatsapp.whatsappRuntime)
}

export function getWhatsappRuntime(): WhatsappRuntime {
  if (needsRuntimeRebuild()) {
    const priorHealth = globalForWhatsapp.whatsappRuntime
      ? checkRuntimeIntegrity(globalForWhatsapp.whatsappRuntime)
      : undefined
    if (globalForWhatsapp.whatsappRuntime) {
      console.info('[RUNTIME_REBUILD]', {
        at: new Date().toISOString(),
        fromVersion: globalForWhatsapp.whatsappRuntimeVersion,
        toVersion: WHATSAPP_RUNTIME_VERSION,
        missing: priorHealth?.missing ?? [],
      })
      invalidateRuntimeCache('integrity-or-version-mismatch', priorHealth)
    }
    globalForWhatsapp.whatsappRuntime = createRuntime()
    globalForWhatsapp.whatsappRuntimeVersion = WHATSAPP_RUNTIME_VERSION
  }
  return globalForWhatsapp.whatsappRuntime!
}

function ensureWhatsappPipelinesRegistered(): void {
  const runtime = getWhatsappRuntime()
  if (
    globalForWhatsapp.whatsappPipelinesRegistered &&
    globalForWhatsapp.registeredPipelineEventBus === runtime.eventBus
  ) {
    return
  }

  globalForWhatsapp.pipelineCleanup?.()
  globalForWhatsapp.pipelineCleanup = undefined

  const messagePipeline = new WhatsappMessagePipeline(
    runtime.eventBus,
    runtime.ensureChatDiscoveredUseCase,
    runtime.storeUseCase,
    async (chatId, hint) => {
      if (hint?.trim()) return hint.trim()
      const result = await runtime.resolveChatNamesUseCase.execute({ chatIds: [chatId] })
      const match = result.results.find((entry) => entry.chatId === chatId)
      return match?.name ?? null
    },
    async (payload) => {
      if (payload.messageType === 'AUDIO' && !payload.fromMe) {
        const config = await runtime.chatConfigRepository.findByChatId(payload.chatId)
        if (config?.audioProcessingEnabled) {
          return { ...payload, content: AUDIO_PENDING_CONTENT }
        }
      }
      return payload
    },
  )
  const connectionPipeline = new WhatsappConnectionPipeline(runtime.eventBus)

  const agentOutboundTracker = new AgentOutboundTracker()
  const agentReplyDeduplicator = new AgentReplyDeduplicator(
    agentOutboundTracker,
    runtime.messageRepository,
  )
  const recordTokenUsage = new RecordApiTokenUsageUseCase(new ApiTokenUsagePrismaRepository(prisma))
  const onAgentTokenUsage = async (usage: {
    tokensInput: number
    tokensOutput: number
    model: string
    chatId?: string
    messageId?: string
  }) => {
    await recordTokenUsage.execute({
      category: 'agent_message',
      chatId: usage.chatId,
      messageId: usage.messageId,
      model: usage.model,
      provider: 'openai',
      tokensInput: usage.tokensInput,
      tokensOutput: usage.tokensOutput,
    })
  }
  const agentChatProvider: AgentChatProvider = {
    generateReply: async (input) => {
      const provider = await createAgentChatProvider(onAgentTokenUsage)
      if (!provider) {
        throw new Error('AI chat provider not configured')
      }
      return provider.generateReply(input)
    },
  }
  const humanTakeoverUseCase = new HandleHumanTakeoverUseCase(runtime.chatConfigRepository)
  const pauseAfterDeferralUseCase = new PauseAgentAfterDeferralUseCase(runtime.chatConfigRepository)
  const processAgentAutoReplyUseCase = new ProcessAgentAutoReplyUseCase({
    chatConfigRepository: runtime.chatConfigRepository,
    messageRepository: runtime.messageRepository,
    agentChatProvider,
    sendMessage: (message) => runtime.provider.sendMessage(message),
    isWhatsappConnected: () => runtime.provider.getStatus().status === 'connected',
    hasOpenAIKey: () => Boolean(config.openai.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim()),
    hasAiProvider: () => hasAiProvider('chat'),
    pauseAfterDeferral: pauseAfterDeferralUseCase,
    agentOutboundTracker,
    replyDeduplicator: agentReplyDeduplicator,
    composeAgentPrompt: composeAgentPromptUseCase,
    searchKnowledge: searchKnowledgeUseCase,
    getPersona: getDefaultPersona,
    getCompanyName: async () => {
      const settings = await settingsRepo.get()
      return settings.companyName?.trim() || undefined
    },
    persistOutbound: async ({ chatId, content, triggerMessageId }) => {
      const saved = await runtime.storeUseCase.execute({
        externalMessageId: `agent-${randomUUID()}`,
        chatId,
        chatName: null,
        sender: 'me',
        senderId: chatId,
        senderName: 'Você',
        content,
        messageType: 'TEXT',
        rawPayload: { source: 'agent-auto-reply', triggerMessageId },
        fromMe: true,
        receivedAt: new Date(),
      })
      await runtime.messageRepository.markSourceAgent(saved.id)
    },
  })
  const mediaDownloader = new MediaDownloader()
  const transcribeAudioUseCase = new TranscribeAudioUseCase(
    runtime.chatConfigRepository,
    runtime.messageRepository,
    mediaDownloader,
    {
      transcribeAudio: async (filePath) => {
        const provider = await getUnifiedProvider('transcription')
        if (!provider) throw new Error('Transcription provider not configured — use OpenAI Whisper')
        const result = await provider.transcribeAudio(filePath)
        return {
          text: result.text,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
          model: result.model,
        }
      },
    },
    recordTokenUsage,
    runtime.eventBus,
  )
  const retryPendingAudioTranscriptionsUseCase = new RetryPendingAudioTranscriptionsUseCase(
    runtime.messageRepository,
    transcribeAudioUseCase,
  )
  globalForWhatsapp.transcribeAudioUseCase = transcribeAudioUseCase
  globalForWhatsapp.retryPendingAudioTranscriptionsUseCase = retryPendingAudioTranscriptionsUseCase
  const processPhotoUseCase = new ProcessPhotoUseCase(
    runtime.chatConfigRepository,
    runtime.messageRepository,
    mediaDownloader,
    {
      describeImage: async (filePath, prompt) => {
        const provider = await getUnifiedProvider('vision')
        if (!provider) throw new Error('Vision provider not configured')
        const result = await provider.describeImage(filePath, prompt)
        return {
          text: result.text,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
          model: result.model,
        }
      },
    },
    recordTokenUsage,
    runtime.eventBus,
  )
  const agentAutoReplyPipeline = new AgentAutoReplyPipeline(
    runtime.eventBus,
    runtime.messageRepository,
    humanTakeoverUseCase,
    processAgentAutoReplyUseCase,
    agentOutboundTracker,
  )
  const mediaProcessingPipeline = new MediaProcessingPipeline(
    runtime.eventBus,
    runtime.chatConfigRepository,
    runtime.messageRepository,
    (messageId) => processPhotoUseCase.execute(messageId),
    (messageId) => transcribeAudioUseCase.execute(messageId),
  )

  const pipelineCleanups: Array<() => void> = []
  pipelineCleanups.push(messagePipeline.register())
  connectionPipeline.register(runtime.provider)
  pipelineCleanups.push(agentAutoReplyPipeline.register())
  pipelineCleanups.push(mediaProcessingPipeline.register())
  globalForWhatsapp.pipelineCleanup = () => {
    for (const cleanup of pipelineCleanups) cleanup()
  }
  registerDailyReportJob({
    chatConfigRepository: runtime.chatConfigRepository,
    messageRepository: runtime.messageRepository,
  })

  runtime.provider.onMessage(async (message: IncomingMessage) => {
    const state = getOperationalState()
    state.lastMessageAt = new Date()
    recordOperationalEvent('messages.upsert')
    logRc02EventBusPublish(DomainEvents.WhatsappMessageReceived, {
      chatId: message.chatId,
      messageId: message.externalMessageId,
      messageType: message.messageType,
    })
    await runtime.eventBus.publish({
      name: DomainEvents.WhatsappMessageReceived,
      payload: message,
      occurredAt: new Date(),
    })
  })

  if (!globalForWhatsapp.whatsappStatusListeners) {
    globalForWhatsapp.whatsappStatusListeners = new Set()
  }

  runtime.provider.onStatusChange((status) => {
    recordOperationalEvent(`connection.${status.status}`)
    if (status.status === 'connected') {
      markWhatsappConnected()
    }
    if (status.status === 'disconnected') {
      resetSyncOnDisconnect()
    }
    for (const listener of globalForWhatsapp.whatsappStatusListeners ?? []) {
      listener(status)
    }
  })

  globalForWhatsapp.registeredPipelineEventBus = runtime.eventBus
  globalForWhatsapp.processAgentAutoReplyUseCase = processAgentAutoReplyUseCase
  globalForWhatsapp.whatsappPipelinesRegistered = true
}

export async function bootstrapWhatsappRuntime(): Promise<void> {
  if (!globalForWhatsapp.whatsappBootstrapPromise) {
    globalForWhatsapp.whatsappBootstrapPromise = (async () => {
      const operational = getOperationalState()
      operational.sessionLoaded = isValidAuthSession(config.whatsapp.sessionPath)
      ensureWhatsappPipelinesRegistered()
      const { getAppLogger } = await import('@/lib/logging/app-log-sink')
      getAppLogger().info('[whatsapp] Pipelines registered', {
        pipelinesRegistered: areWhatsappPipelinesRegistered(),
        runtimeVersion: WHATSAPP_RUNTIME_VERSION,
      })

      if (!operational.sessionLoaded) {
        console.info('[whatsapp/bootstrap] no valid session on disk — waiting for manual connect')
        return
      }

      console.info('[whatsapp/bootstrap] valid session detected — scheduling auto-connect')
      setImmediate(() => {
        void (async () => {
          const { provider } = getWhatsappRuntime()
          try {
            await provider.connect()
          } catch (error) {
            const { getAppLogger } = await import('@/lib/logging/app-log-sink')
            getAppLogger().error('[whatsapp/bootstrap] auto-connect failed', {
              error: error instanceof Error ? error.message : String(error),
            })
          }
        })()
      })
    })().catch((error) => {
      globalForWhatsapp.whatsappBootstrapPromise = undefined
      throw error
    })
  }

  return globalForWhatsapp.whatsappBootstrapPromise
}

export function subscribeWhatsappStatus(listener: StatusListener): () => void {
  if (!globalForWhatsapp.whatsappStatusListeners) {
    globalForWhatsapp.whatsappStatusListeners = new Set()
  }
  globalForWhatsapp.whatsappStatusListeners.add(listener)
  listener(getWhatsappRuntime().provider.getStatus())
  return () => globalForWhatsapp.whatsappStatusListeners?.delete(listener)
}

export async function getWhatsappMessageMetrics() {
  const { metricsUseCase } = getWhatsappRuntime()
  const capture = getMessageCaptureMetrics()
  const dbMetrics = await metricsUseCase.execute()
  const totalReceived = Math.max(capture.totalReceived, dbMetrics.totalPersisted)
  const totalPersisted = dbMetrics.totalPersisted
  const lossRate = totalReceived === 0 ? 0 : Math.max(0, totalReceived - totalPersisted) / totalReceived

  return {
    totalReceived,
    totalPersisted,
    lossRate,
    types: dbMetrics.persistedByType,
    emptyTextCount: dbMetrics.emptyTextCount,
    captureFailed: capture.totalFailed,
  }
}

export async function getWhatsappFidelityMetrics() {
  const { fidelityUseCase } = getWhatsappRuntime()
  return fidelityUseCase.execute()
}

export function getWhatsappArchiveHealth() {
  return buildArchiveHealthSnapshot(getMessageCaptureMetrics())
}

export function getChatIdentityResolver(): ChatIdentityResolver {
  const ownJid = getOwnJidFromAuthSession(config.whatsapp.sessionPath)
  const { contactNameResolver } = getWhatsappRuntime()
  const ownDisplayName = ownJid ? contactNameResolver.getBestName(ownJid) : null
  return new ChatIdentityResolver(ownJid, ownDisplayName)
}

export async function waitForProviderStatus(
  predicate: (status: WhatsappStatus) => boolean,
  timeoutMs = 15_000,
  intervalMs = 250,
): Promise<WhatsappStatus> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const status = getWhatsappRuntime().provider.getStatus()
    if (predicate(status)) return status
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return getWhatsappRuntime().provider.getStatus()
}

export async function ensureWhatsappReady(): Promise<void> {
  const { ensureServerReady } = await import('@/lib/server-ready')
  await ensureServerReady()
  await bootstrapWhatsappRuntime()
}

export function areWhatsappPipelinesRegistered(): boolean {
  if (!globalForWhatsapp.whatsappPipelinesRegistered) return false
  if (!globalForWhatsapp.whatsappRuntime) return false
  return globalForWhatsapp.registeredPipelineEventBus === globalForWhatsapp.whatsappRuntime.eventBus
}

export function getProcessAgentAutoReplyUseCase(): ProcessAgentAutoReplyUseCase {
  ensureWhatsappPipelinesRegistered()
  if (!globalForWhatsapp.processAgentAutoReplyUseCase) {
    throw new Error('Agent auto-reply use case not initialized')
  }
  return globalForWhatsapp.processAgentAutoReplyUseCase
}

export function isPipelineEventBusBound(): boolean {
  return areWhatsappPipelinesRegistered()
}

export type WhatsappDiagnostics = {
  connected: boolean
  liveMessageCount: number
  dbMessageCount: number
  chatConfigCount: number
  archiveEnabledCount: number
  lastEventName: string | null
  lastEventAt: string | null
  lastMessageAt: string | null
  syncFullHistory: boolean
  pipelinesRegistered: boolean
  agentAutoReply: {
    pipelinesRegistered: boolean
    eventBusBound: boolean
    lastDecision: ReturnType<typeof getAgentReplyDiagnostics>['lastDecision']
  }
  runtimeHealth: RuntimeHealth
  hints: string[]
}

export async function getWhatsappDiagnostics(): Promise<WhatsappDiagnostics> {
  const operational = await getWhatsappOperationalStatus()
  const archiveEnabledCount = await prisma.whatsappChatConfig.count({
    where: { archiveEnabled: true },
  })
  const settings = await prisma.appSettings.findUnique({ where: { id: 'default' } })
  const importHistoryEnabled = settings ? !settings.whatsappIgnoreHistory : false
  const hints: string[] = []

  if (operational.connected && operational.liveMessageCount === 0) {
    hints.push('Send a test message from phone after connecting')
  }
  if (operational.chatCount === 0 && operational.connected) {
    hints.push('Chats appear after WhatsApp sends conversation metadata or a new message arrives')
  }
  if (operational.messageCount > 0 && archiveEnabledCount === 0) {
    hints.push('Enable chats in Permissions to see them in Messages')
  }
  if (!importHistoryEnabled) {
    hints.push('Old chat history is not imported by default')
  }
  if (operational.operationalMessage) {
    hints.push(operational.operationalMessage)
  }

  const pausedChats = await prisma.whatsappChatConfig.findMany({
    where: { agentChatEnabled: true, agentPaused: true },
    select: { displayNumber: true, agentPausedReason: true },
    take: 5,
  })
  for (const chat of pausedChats) {
    const reason =
      chat.agentPausedReason === 'human_takeover'
        ? 'human takeover'
        : chat.agentPausedReason ?? 'paused'
    hints.push(`Chat #${chat.displayNumber}: agent-paused (${reason}) — religue Resposta IA`)
  }

  return {
    connected: operational.connected,
    liveMessageCount: operational.liveMessageCount,
    dbMessageCount: operational.messageCount,
    chatConfigCount: operational.chatCount,
    archiveEnabledCount,
    lastEventName: operational.lastEventName,
    lastEventAt: operational.lastEventAt,
    lastMessageAt: operational.lastMessageAt,
    syncFullHistory: importHistoryEnabled,
    pipelinesRegistered: areWhatsappPipelinesRegistered(),
    agentAutoReply: {
      pipelinesRegistered: areWhatsappPipelinesRegistered(),
      eventBusBound: isPipelineEventBusBound(),
      lastDecision: getAgentReplyDiagnostics().lastDecision,
    },
    runtimeHealth: getRuntimeHealth(),
    hints,
  }
}

export async function getWhatsappOperationalStatus(): Promise<WhatsappOperationalStatus> {
  await bootstrapWhatsappRuntime()
  const { provider, messageRepository } = getWhatsappRuntime()
  const status = provider.getStatus()
  const operational = getOperationalState()
  const [messageCount, chatCount, groupCount, lastMessage] = await Promise.all([
    messageRepository.count(),
    prisma.whatsappChatConfig.count(),
    prisma.whatsappChatConfig.count({ where: { chatId: { endsWith: '@g.us' } } }),
    prisma.whatsappMessage.findFirst({
      orderBy: { receivedAt: 'desc' },
      select: { receivedAt: true },
    }),
  ])

  return {
    status: status.status,
    connected: status.status === 'connected',
    authenticated: status.authenticated,
    sessionLoaded: operational.sessionLoaded,
    qrCode: status.qrCode,
    qrCodeDataUrl: status.qrCodeDataUrl,
    lastConnectedAt: status.lastConnectedAt?.toISOString() ?? null,
    messageCount,
    liveMessageCount: status.messageCount,
    chatCount,
    groupCount,
    lastMessageAt:
      operational.lastMessageAt?.toISOString() ?? lastMessage?.receivedAt.toISOString() ?? null,
    lastEventAt: operational.lastEventAt?.toISOString() ?? null,
    lastEventName: operational.lastEventName,
    operationalMessage: status.operationalMessage ?? null,
  }
}

export function resetNameBootstrapFlag(): void {
  globalForWhatsapp.nameBootstrapDone = false
}

export async function resetWhatsappRuntimeAfterDataWipe(): Promise<void> {
  const wasConnected =
    globalForWhatsapp.whatsappRuntime?.provider.getStatus().status === 'connected'
  invalidateRuntimeCache('whatsapp-data-reset')
  resetSyncOnDisconnect()
  if (wasConnected) {
    markWhatsappConnected()
  }
  globalForWhatsapp.nameBootstrapDone = false
}

export async function runManualContactSync(): Promise<{ processed: number; message: string }> {
  await bootstrapWhatsappRuntime()
  const runtime = getWhatsappRuntime()
  const status = runtime.provider.getStatus()
  if (status.status !== 'connected') {
    const error = new Error('WhatsApp desconectado') as Error & { statusCode?: number }
    error.statusCode = 503
    throw error
  }

  resetSyncStateForManualRun()
  resetNameBootstrapFlag()

  try {
    await runtime.runContactBootstrap()
    const configs = await runtime.listChatConfigsUseCase.execute()
    if (configs.length > 0) {
      await runtime.resolveChatNamesUseCase.execute({
        chatIds: configs.map((row) => row.chatId),
      })
    }

    let chatCount = await prisma.whatsappChatConfig.count()
    if (chatCount === 0) {
      const policy = await loadWhatsappDiscoveryPolicy(prisma)
      const anyEnabled =
        policy.syncGroupsEnabled ||
        policy.syncAddressBookEnabled ||
        policy.syncChatsMetadataEnabled
      if (!anyEnabled) {
        const message =
          'Nenhuma opção de sincronização ativa. Ative em Configurações → WhatsApp.'
        completeSync(message)
        return { processed: getContactSyncSnapshot().processed, message }
      }

      if (runtime.provider.reconnectForSync) {
        await runtime.provider.reconnectForSync()
        await waitForProviderStatus((s) => s.status === 'connected', 30_000)
      }
      chatCount = await prisma.whatsappChatConfig.count()
    }

    const message =
      chatCount > 0
        ? 'Sincronização concluída'
        : 'Sincronização concluída — aguardando conversas'
    completeSync(message)
    const { getAppLogger } = await import('@/lib/logging/app-log-sink')
    getAppLogger().info('[whatsapp] Sincronização manual de contatos', {
      processed: getContactSyncSnapshot().processed,
      chatCount,
    })
    return { processed: getContactSyncSnapshot().processed, message }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Falha na sincronização'
    failSync(msg)
    throw error
  }
}
