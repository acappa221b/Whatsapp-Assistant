import type { PrismaClient } from '@prisma/client'

export type AppSettingsRecord = {
  id: string
  appName: string
  timezone: string
  port: number
  companyName: string
  databasePath: string
  whatsappSessionPath: string
  mediaStoragePath: string
  whatsappAutoReconnect: boolean
  whatsappReconnectDelayMs: number
  whatsappIgnoreHistory: boolean
  syncGroupsEnabled: boolean
  syncAddressBookEnabled: boolean
  syncChatsMetadataEnabled: boolean
  settingsEncryptionSecret: string | null
  encryptionSecretGenerated: boolean
  setupCompleted: boolean
  reportAutoEnabled: boolean
  reportAutoTime: string
  reportTimezone: string
  lastAutoReportRunDate: string | null
  defaultAiProvider: string
  defaultChatProviderId: string | null
  defaultTranscriptionProviderId: string | null
  defaultVisionProviderId: string | null
  defaultReportProviderId: string | null
  defaultAssistantProviderId: string | null
  updateCheckEnabled: boolean
  lastUpdateCheckAt: Date | null
  dismissedUpdateVersion: string | null
  updatedAt: Date
}

export type UpdateAppSettingsInput = Partial<
  Pick<
    AppSettingsRecord,
    | 'appName'
    | 'timezone'
    | 'port'
    | 'companyName'
    | 'whatsappAutoReconnect'
    | 'whatsappReconnectDelayMs'
    | 'whatsappIgnoreHistory'
    | 'syncGroupsEnabled'
    | 'syncAddressBookEnabled'
    | 'syncChatsMetadataEnabled'
    | 'setupCompleted'
    | 'reportAutoEnabled'
    | 'reportAutoTime'
    | 'reportTimezone'
    | 'lastAutoReportRunDate'
    | 'defaultChatProviderId'
    | 'defaultTranscriptionProviderId'
    | 'defaultVisionProviderId'
    | 'defaultReportProviderId'
    | 'defaultAssistantProviderId'
    | 'updateCheckEnabled'
    | 'lastUpdateCheckAt'
    | 'dismissedUpdateVersion'
  >
>

export class AppSettingsPrismaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async ensureDefault(): Promise<AppSettingsRecord> {
    const existing = await this.prisma.appSettings.findUnique({ where: { id: 'default' } })
    if (existing) return this.map(existing)
    const created = await this.prisma.appSettings.create({ data: { id: 'default' } })
    return this.map(created)
  }

  async get(): Promise<AppSettingsRecord> {
    return this.ensureDefault()
  }

  async update(input: UpdateAppSettingsInput): Promise<AppSettingsRecord> {
    await this.ensureDefault()
    const saved = await this.prisma.appSettings.update({
      where: { id: 'default' },
      data: input,
    })
    return this.map(saved)
  }

  private map(row: {
    id: string
    appName: string
    timezone: string
    port: number
    companyName: string
    databasePath: string
    whatsappSessionPath: string
    mediaStoragePath: string
    whatsappAutoReconnect: boolean
    whatsappReconnectDelayMs: number
    whatsappIgnoreHistory: boolean
    syncGroupsEnabled: boolean
    syncAddressBookEnabled: boolean
    syncChatsMetadataEnabled: boolean
    settingsEncryptionSecret: string | null
    encryptionSecretGenerated: boolean
    setupCompleted: boolean
    reportAutoEnabled: boolean
    reportAutoTime: string
    reportTimezone: string
    lastAutoReportRunDate: string | null
    defaultAiProvider: string
    defaultChatProviderId: string | null
    defaultTranscriptionProviderId: string | null
    defaultVisionProviderId: string | null
    defaultReportProviderId: string | null
    defaultAssistantProviderId: string | null
    updateCheckEnabled: boolean
    lastUpdateCheckAt: Date | null
    dismissedUpdateVersion: string | null
    updatedAt: Date
  }): AppSettingsRecord {
    return { ...row }
  }
}
