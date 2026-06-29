export type {
  AssistantCommand,
  AssistantTarget,
  AssistantPreview,
  ResolvedTarget,
} from './domain/assistant-command.types'
export { ParseAssistantCommandUseCase, heuristicParse } from './application/parse-assistant-command.use-case'
export type { CommandParserPort } from './application/parse-assistant-command.use-case'
export {
  ResolveAssistantTargetsUseCase,
  type ChatConfigForResolve,
  type ResolveTargetsResult,
} from './application/resolve-assistant-targets.use-case'
export { ComposeAssistantMessageUseCase } from './application/compose-assistant-message.use-case'
export type { MessageComposerPort } from './application/compose-assistant-message.use-case'
export { ExecuteAssistantCommandUseCase } from './application/execute-assistant-command.use-case'
export type { WhatsappSendPort, AssistantActionLogPort } from './application/execute-assistant-command.use-case'
export { QueryAssistantKnowledgeUseCase } from './application/query-assistant-knowledge.use-case'
export type {
  KnowledgeQueryPort,
  KnowledgeLlmPort,
  ReportSnippet,
  MessageSnippet,
} from './application/query-assistant-knowledge.use-case'
