import { formatChatDisplayId } from './chat-display-id'

export function serializeWhatsappChatConfigApi(config: {
  chatId: string
  displayNumber: number
  name: string | null
  storageDir?: string | null
  archiveEnabled: boolean
  agentChatEnabled: boolean
  photoProcessingEnabled: boolean
  audioProcessingEnabled: boolean
  reportGenerationEnabled: boolean
  agentPaused?: boolean
  agentPausedReason?: string | null
  updatedAt: Date
  nameResolved?: boolean
}) {
  return {
    chatId: config.chatId,
    displayNumber: config.displayNumber,
    displayLabel: formatChatDisplayId(config.displayNumber),
    name: config.name,
    storageDir: config.storageDir ?? null,
    nameResolved: config.nameResolved,
    archiveEnabled: config.archiveEnabled,
    agentChatEnabled: config.agentChatEnabled,
    photoProcessingEnabled: config.photoProcessingEnabled,
    audioProcessingEnabled: config.audioProcessingEnabled,
    reportGenerationEnabled: config.reportGenerationEnabled,
    agentPaused: config.agentPaused ?? false,
    agentPausedReason: config.agentPausedReason ?? null,
    updatedAt: config.updatedAt.toISOString(),
  }
}
