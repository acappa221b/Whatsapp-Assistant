import {
  AiKnowledgeDocumentPrismaRepository,
  AiPersonaPrismaRepository,
  prisma,
  type AiKnowledgeDocumentRecord,
  type AiPersonaRecord,
} from '@finance-ai/database'
import {
  ComposeAgentPromptUseCase,
  PreviewAgentReplyUseCase,
  SearchKnowledgeUseCase,
  type AiKnowledgeDocument,
  type AiPersonaProfile,
} from '@finance-ai/core/domains/ai-training'
import { settingsRepo } from '@/lib/ai/ai-provider-service'
import { createAgentChatProvider } from '@/lib/ai/ai-provider-service'

const personaRepo = new AiPersonaPrismaRepository(prisma)
const knowledgeRepo = new AiKnowledgeDocumentPrismaRepository(prisma)

export const composeAgentPromptUseCase = new ComposeAgentPromptUseCase()

function mapPersona(record: AiPersonaRecord): AiPersonaProfile {
  return {
    id: record.id,
    usageMode: record.usageMode,
    presetId: record.presetId,
    toneFormal: record.toneFormal,
    responseLength: record.responseLength,
    useEmojis: record.useEmojis,
    customInstructions: record.customInstructions,
    exampleReplies: record.exampleReplies,
    behaviorFlags: record.behaviorFlags,
    salesPlaybook: record.salesPlaybook,
    learnFromHistory: record.learnFromHistory,
    historySampleLimit: record.historySampleLimit,
  }
}

function mapKnowledge(record: AiKnowledgeDocumentRecord): AiKnowledgeDocument {
  return {
    id: record.id,
    title: record.title,
    type: record.type,
    status: record.status,
    storagePath: record.storagePath,
    useInAgent: record.useInAgent,
    parsedContent: record.parsedContent,
    errorMessage: record.errorMessage,
  }
}

export const searchKnowledgeUseCase = new SearchKnowledgeUseCase(async () => {
  const docs = await knowledgeRepo.listReadyForAgent()
  return docs.map(mapKnowledge)
})

export async function getDefaultPersona(): Promise<AiPersonaProfile> {
  return mapPersona(await personaRepo.getDefault())
}

export async function getCompanyName(): Promise<string | undefined> {
  const settings = await settingsRepo.get()
  return settings.companyName?.trim() || undefined
}

export const previewAgentReplyUseCase = new PreviewAgentReplyUseCase(
  {
    generateReply: async (input) => {
      const provider = await createAgentChatProvider()
      if (!provider) throw new Error('AI chat provider not configured')
      return provider.generateReply(input)
    },
  },
  composeAgentPromptUseCase,
  searchKnowledgeUseCase,
)

export { personaRepo, knowledgeRepo, mapPersona }
