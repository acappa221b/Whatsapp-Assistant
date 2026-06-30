import type { AgentChatProvider, AgentReplyInput, AgentReplyOutput } from '../../agent-chat/application/process-agent-auto-reply.use-case'
import { ComposeAgentPromptUseCase } from './compose-agent-prompt.use-case'
import { SearchKnowledgeUseCase } from './search-knowledge.use-case'
import type { AiPersonaProfile } from '../domain/ai-persona'

export type PreviewAgentReplyInput = {
  message: string
  chatId?: string
  ownerStyleSamples?: string[]
  persona: AiPersonaProfile
  companyName?: string
}

export type PreviewAgentReplyResult = AgentReplyOutput & {
  systemPrompt: string
  matchedDocuments: Array<{ id: string; title: string; score: number }>
}

export class PreviewAgentReplyUseCase {
  constructor(
    private readonly agentChatProvider: AgentChatProvider,
    private readonly composeAgentPrompt: ComposeAgentPromptUseCase,
    private readonly searchKnowledge: SearchKnowledgeUseCase,
  ) {}

  async execute(input: PreviewAgentReplyInput): Promise<PreviewAgentReplyResult> {
    const knowledge = await this.searchKnowledge.execute({ query: input.message, limit: 3 })
    const ownerStyleSamples =
      input.persona.learnFromHistory && input.ownerStyleSamples
        ? input.ownerStyleSamples.slice(0, input.persona.historySampleLimit)
        : []

    const systemPrompt = this.composeAgentPrompt.execute({
      persona: input.persona,
      knowledgeContext: knowledge.contextText,
      ownerStyleSamples,
      usageContext: 'whatsapp_auto_reply',
      companyName: input.companyName,
    })

    const replyInput: AgentReplyInput = {
      incomingMessage: input.message,
      chatId: input.chatId ?? 'preview-chat',
      ownerStyleSamples,
      recentContext: [],
      hasOwnerHistory: ownerStyleSamples.length > 0,
      systemPrompt,
    }

    const result = await this.agentChatProvider.generateReply(replyInput)
    return {
      ...result,
      systemPrompt,
      matchedDocuments: knowledge.matchedDocuments,
    }
  }
}
