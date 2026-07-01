export { prisma, type PrismaClient } from './client'
export { getRuntimeDatabaseDiagnostics, type RuntimeDatabaseDiagnostics } from './runtime-diagnostics'
export {
  countAppliedMigrations,
  ensureStorageDirectories,
  listSqliteTables,
  StartupValidationError,
  validateRuntimeStartup,
  type StartupValidationResult,
} from './startup-validation'
export { ExpenseMapper } from './mappers/expense.mapper'
export { RevenueMapper } from './mappers/revenue.mapper'
export { CategoryMapper } from './mappers/category.mapper'
export { SupplierMapper } from './mappers/supplier.mapper'
export { UserMapper } from './mappers/user.mapper'
export { WhatsappMessageMapper } from './mappers/whatsapp-message.mapper'
export { WhatsappChatConfigMapper } from './mappers/whatsapp-chat-config.mapper'
export { ExtractionMapper } from './mappers/extraction.mapper'
export { ExpensePrismaRepository } from './repositories/expense.prisma-repository'
export { RevenuePrismaRepository } from './repositories/revenue.prisma-repository'
export { CategoryPrismaRepository } from './repositories/category.prisma-repository'
export { SupplierPrismaRepository } from './repositories/supplier.prisma-repository'
export { UserPrismaRepository } from './repositories/user.prisma-repository'
export { WhatsappMessagePrismaRepository } from './repositories/whatsapp-message.prisma-repository'
export { WhatsappChatConfigPrismaRepository } from './repositories/whatsapp-chat-config.prisma-repository'
export { ExtractionPrismaRepository } from './repositories/extraction.prisma-repository'
export { ApiTokenUsagePrismaRepository } from './repositories/api-token-usage.prisma-repository'
export { DashboardAnalyticsPrismaRepository } from './repositories/dashboard-analytics.prisma-repository'
export { ConversationDailyReportPrismaRepository } from './repositories/conversation-daily-report.prisma-repository'
export { AppSettingsPrismaRepository } from './repositories/app-settings.prisma-repository'
export type { AppSettingsRecord, UpdateAppSettingsInput } from './repositories/app-settings.prisma-repository'
export { AiProviderConfigPrismaRepository } from './repositories/ai-provider-config.prisma-repository'
export type {
  AiProviderConfigRecord,
  CreateAiProviderInput,
  UpdateAiProviderInput,
} from './repositories/ai-provider-config.prisma-repository'
export type { AiProviderType } from '@prisma/client'
export { AssistantActionLogPrismaRepository } from './repositories/assistant-action-log.prisma-repository'
export { AiPersonaPrismaRepository } from './repositories/ai-persona.prisma-repository'
export type { AiPersonaRecord, UpdateAiPersonaInput } from './repositories/ai-persona.prisma-repository'
export { AiKnowledgeDocumentPrismaRepository } from './repositories/ai-knowledge-document.prisma-repository'
export type {
  AiKnowledgeDocumentRecord,
  CreateKnowledgeDocumentInput,
  KnowledgeDocumentType,
  KnowledgeDocumentStatus,
} from './repositories/ai-knowledge-document.prisma-repository'
export {
  clearWhatsappMediaStorage,
  countMediaFilesRecursive,
  deleteWhatsappDataInTransaction,
  type WhatsappDataDeleteCounts,
} from './whatsapp-data-reset'
export { AppLogPrismaRepository } from './repositories/app-log.prisma-repository'
export type {
  AppLogRecord,
  AppendAppLogInput,
  ListAppLogsQuery,
  CountAppLogsQuery,
} from './repositories/app-log.prisma-repository'
