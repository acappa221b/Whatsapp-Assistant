import { ValidationError } from '@finance-ai/shared/errors'

export type AgentPausedReason = 'deferral' | 'human_takeover'

export type WhatsappChatConfigProps = {
  chatId: string
  displayNumber: number
  name: string | null
  storageDir: string | null
  archiveEnabled: boolean
  aiProcessingEnabled: boolean
  agentChatEnabled: boolean
  photoProcessingEnabled: boolean
  audioProcessingEnabled: boolean
  reportGenerationEnabled: boolean
  agentPaused: boolean
  agentPausedReason: AgentPausedReason | null
  agentPausedAt: Date | null
  updatedAt: Date
}

export class WhatsappChatConfig {
  readonly chatId: string
  readonly displayNumber: number
  readonly name: string | null
  readonly storageDir: string | null
  readonly archiveEnabled: boolean
  readonly aiProcessingEnabled: boolean
  readonly agentChatEnabled: boolean
  readonly photoProcessingEnabled: boolean
  readonly audioProcessingEnabled: boolean
  readonly reportGenerationEnabled: boolean
  readonly agentPaused: boolean
  readonly agentPausedReason: AgentPausedReason | null
  readonly agentPausedAt: Date | null
  readonly updatedAt: Date

  private constructor(props: WhatsappChatConfigProps) {
    this.chatId = props.chatId
    this.displayNumber = props.displayNumber
    this.name = props.name
    this.storageDir = props.storageDir
    this.archiveEnabled = props.archiveEnabled
    this.aiProcessingEnabled = props.aiProcessingEnabled
    this.agentChatEnabled = props.agentChatEnabled
    this.photoProcessingEnabled = props.photoProcessingEnabled
    this.audioProcessingEnabled = props.audioProcessingEnabled
    this.reportGenerationEnabled = props.reportGenerationEnabled
    this.agentPaused = props.agentPaused
    this.agentPausedReason = props.agentPausedReason
    this.agentPausedAt = props.agentPausedAt
    this.updatedAt = props.updatedAt
  }

  static create(input: {
    chatId: string
    displayNumber?: number
    name?: string | null
    storageDir?: string | null
    archiveEnabled?: boolean
    aiProcessingEnabled?: boolean
    agentChatEnabled?: boolean
    photoProcessingEnabled?: boolean
    audioProcessingEnabled?: boolean
    reportGenerationEnabled?: boolean
    agentPaused?: boolean
    agentPausedReason?: AgentPausedReason | null
    agentPausedAt?: Date | null
    now?: Date
  }): WhatsappChatConfig {
    const chatId = input.chatId.trim()
    if (!chatId) throw new ValidationError('Chat ID is required')

    const name = input.name?.trim() || null
    const now = input.now ?? new Date()
    const archiveEnabled = input.archiveEnabled ?? false

    return WhatsappChatConfig.normalizeFlags({
      chatId,
      displayNumber: input.displayNumber ?? 0,
      name,
      storageDir: input.storageDir ?? null,
      archiveEnabled,
      aiProcessingEnabled: false,
      agentChatEnabled: input.agentChatEnabled ?? false,
      photoProcessingEnabled: input.photoProcessingEnabled ?? false,
      audioProcessingEnabled: input.audioProcessingEnabled ?? false,
      reportGenerationEnabled: input.reportGenerationEnabled ?? false,
      agentPaused: input.agentPaused ?? false,
      agentPausedReason: input.agentPausedReason ?? null,
      agentPausedAt: input.agentPausedAt ?? null,
      updatedAt: now,
    })
  }

  static reconstitute(props: WhatsappChatConfigProps): WhatsappChatConfig {
    return new WhatsappChatConfig(props)
  }

  withName(name: string): WhatsappChatConfig {
    const trimmed = name.trim()
    return new WhatsappChatConfig({
      ...this,
      name: trimmed || this.name,
      updatedAt: new Date(),
    })
  }

  withStorageDir(storageDir: string | null): WhatsappChatConfig {
    return new WhatsappChatConfig({
      ...this,
      storageDir: storageDir?.trim() || null,
      updatedAt: new Date(),
    })
  }

  withDisplayNumber(displayNumber: number): WhatsappChatConfig {
    return new WhatsappChatConfig({
      ...this,
      displayNumber,
      updatedAt: new Date(),
    })
  }

  update(input: {
    name?: string | null
    storageDir?: string | null
    archiveEnabled?: boolean
    agentChatEnabled?: boolean
    photoProcessingEnabled?: boolean
    audioProcessingEnabled?: boolean
    reportGenerationEnabled?: boolean
    agentPaused?: boolean
    agentPausedReason?: AgentPausedReason | null
    agentPausedAt?: Date | null
    now?: Date
  }): WhatsappChatConfig {
    const now = input.now ?? new Date()
    const name =
      input.name === undefined
        ? this.name
        : input.name === null
          ? null
          : input.name.trim() || null

    let agentPaused = input.agentPaused ?? this.agentPaused
    let agentPausedReason =
      input.agentPausedReason !== undefined ? input.agentPausedReason : this.agentPausedReason
    let agentPausedAt = input.agentPausedAt !== undefined ? input.agentPausedAt : this.agentPausedAt

    if (input.agentChatEnabled === true) {
      agentPaused = false
      agentPausedReason = null
      agentPausedAt = null
    }

    return WhatsappChatConfig.normalizeFlags({
      chatId: this.chatId,
      displayNumber: this.displayNumber,
      name,
      storageDir: input.storageDir !== undefined ? input.storageDir : this.storageDir,
      archiveEnabled: input.archiveEnabled ?? this.archiveEnabled,
      aiProcessingEnabled: false,
      agentChatEnabled: input.agentChatEnabled ?? this.agentChatEnabled,
      photoProcessingEnabled: input.photoProcessingEnabled ?? this.photoProcessingEnabled,
      audioProcessingEnabled: input.audioProcessingEnabled ?? this.audioProcessingEnabled,
      reportGenerationEnabled: input.reportGenerationEnabled ?? this.reportGenerationEnabled,
      agentPaused,
      agentPausedReason,
      agentPausedAt,
      updatedAt: now,
    })
  }

  applyHumanTakeover(now: Date = new Date()): WhatsappChatConfig {
    return this.update({
      agentChatEnabled: false,
      agentPaused: true,
      agentPausedReason: 'human_takeover',
      agentPausedAt: now,
      now,
    })
  }

  applyDeferralPause(now: Date = new Date()): WhatsappChatConfig {
    return this.update({
      agentPaused: true,
      agentPausedReason: 'deferral',
      agentPausedAt: now,
      now,
    })
  }

  /** RC-11: archive off cascades all feature flags; features independent when archive on. */
  private static normalizeFlags(props: WhatsappChatConfigProps): WhatsappChatConfig {
    let {
      archiveEnabled,
      agentChatEnabled,
      photoProcessingEnabled,
      audioProcessingEnabled,
      reportGenerationEnabled,
    } = props

    if (!archiveEnabled) {
      agentChatEnabled = false
      photoProcessingEnabled = false
      audioProcessingEnabled = false
      reportGenerationEnabled = false
    }

    if (agentChatEnabled && !archiveEnabled) {
      throw new ValidationError('agentChatEnabled requires archiveEnabled')
    }

    return new WhatsappChatConfig({
      ...props,
      archiveEnabled,
      aiProcessingEnabled: false,
      agentChatEnabled,
      photoProcessingEnabled,
      audioProcessingEnabled,
      reportGenerationEnabled,
    })
  }
}
