import type { WhatsappChatConfig as PrismaWhatsappChatConfig } from '@prisma/client'
import {
  WhatsappChatConfig,
  type AgentPausedReason,
} from '@finance-ai/core/domains/whatsapp-chat-config'

export type WhatsappChatConfigPersistence = {
  chatId: string
  name: string | null
  storageDir: string | null
  archiveEnabled: boolean
  aiProcessingEnabled: boolean
  agentChatEnabled: boolean
  photoProcessingEnabled: boolean
  audioProcessingEnabled: boolean
  reportGenerationEnabled: boolean
  agentPaused: boolean
  agentPausedReason: string | null
  agentPausedAt: Date | null
  updatedAt: Date
}

function parseAgentPausedReason(value: string | null): AgentPausedReason | null {
  if (value === 'deferral' || value === 'human_takeover') return value
  return null
}

export const WhatsappChatConfigMapper = {
  toDomain(record: PrismaWhatsappChatConfig): WhatsappChatConfig {
    return WhatsappChatConfig.reconstitute({
      chatId: record.chatId,
      displayNumber: record.displayNumber,
      name: record.name,
      storageDir: record.storageDir ?? null,
      archiveEnabled: record.archiveEnabled,
      aiProcessingEnabled: false,
      agentChatEnabled: record.agentChatEnabled,
      photoProcessingEnabled: record.photoProcessingEnabled,
      audioProcessingEnabled: record.audioProcessingEnabled,
      reportGenerationEnabled: record.reportGenerationEnabled,
      agentPaused: record.agentPaused,
      agentPausedReason: parseAgentPausedReason(record.agentPausedReason),
      agentPausedAt: record.agentPausedAt,
      updatedAt: record.updatedAt,
    })
  },

  toPersistence(config: WhatsappChatConfig): WhatsappChatConfigPersistence {
    return {
      chatId: config.chatId,
      name: config.name,
      storageDir: config.storageDir,
      archiveEnabled: config.archiveEnabled,
      aiProcessingEnabled: false,
      agentChatEnabled: config.agentChatEnabled,
      photoProcessingEnabled: config.photoProcessingEnabled,
      audioProcessingEnabled: config.audioProcessingEnabled,
      reportGenerationEnabled: config.reportGenerationEnabled,
      agentPaused: config.agentPaused,
      agentPausedReason: config.agentPausedReason,
      agentPausedAt: config.agentPausedAt,
      updatedAt: config.updatedAt,
    }
  },
}
