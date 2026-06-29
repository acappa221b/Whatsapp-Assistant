import {
  AiProviderConfigPrismaRepository,
  AppSettingsPrismaRepository,
  prisma,
} from '@finance-ai/database'
import { config } from '@finance-ai/shared/config'
import { decryptSecret, encryptSecret } from '@finance-ai/shared'
import {
  createUnifiedProvider,
  type AiCapability,
  type ProviderCredentials,
  type UnifiedAiProvider,
} from '@finance-ai/ai'
import { OpenAIChatProvider, type TokenUsageCallback } from '@finance-ai/ai'
import { OpenAIDailyReportProvider } from '@finance-ai/ai'
import { getSettingsEncryptionSecret } from '@/lib/bootstrap/app-settings'

const settingsRepo = new AppSettingsPrismaRepository(prisma)
const providerRepo = new AiProviderConfigPrismaRepository(prisma)

async function encryptionSecret(): Promise<string> {
  return getSettingsEncryptionSecret()
}

function capabilityProviderId(
  settings: Awaited<ReturnType<AppSettingsPrismaRepository['get']>>,
  capability: AiCapability,
): string | null {
  switch (capability) {
    case 'chat':
      return settings.defaultChatProviderId
    case 'transcription':
      return settings.defaultTranscriptionProviderId
    case 'vision':
      return settings.defaultVisionProviderId
    case 'report':
      return settings.defaultReportProviderId
    case 'assistant':
      return settings.defaultAssistantProviderId
    default:
      return null
  }
}

async function resolveCredentials(capability: AiCapability): Promise<ProviderCredentials | null> {
  const settings = await settingsRepo.get()
  const providers = await providerRepo.findAll()
  const preferredId = capabilityProviderId(settings, capability)
  const selected =
    (preferredId ? providers.find((p) => p.id === preferredId && p.enabled) : null) ??
    providers.find((p) => p.enabled && p.isDefault) ??
    providers.find((p) => p.enabled)

  if (selected) {
    try {
      const apiKey = decryptSecret(selected.apiKeyEnc, await encryptionSecret())
      return {
        provider: selected.provider,
        apiKey,
        model: selected.model,
        baseUrl: selected.baseUrl,
      }
    } catch (error) {
      console.error('[AiProvider] decrypt failed', { id: selected.id, error })
    }
  }

  return null
}

export async function hasAiProvider(capability: AiCapability): Promise<boolean> {
  return Boolean(await resolveCredentials(capability))
}

export async function getUnifiedProvider(capability: AiCapability): Promise<UnifiedAiProvider | null> {
  const creds = await resolveCredentials(capability)
  if (!creds) return null
  return createUnifiedProvider(creds)
}

export async function createAgentChatProvider(
  onTokenUsage?: TokenUsageCallback,
): Promise<OpenAIChatProvider | null> {
  const creds = await resolveCredentials('chat')
  if (!creds) return null
  return new OpenAIChatProvider({
    apiKey: creds.apiKey,
    model: creds.model ?? config.openai.model,
    onTokenUsage,
  })
}

export async function createDailyReportProvider(): Promise<OpenAIDailyReportProvider | null> {
  const creds = await resolveCredentials('report')
  if (!creds) return null
  return new OpenAIDailyReportProvider({
    apiKey: creds.apiKey,
    model: creds.model ?? config.openai.model,
  })
}

export { settingsRepo, providerRepo, encryptionSecret, encryptSecret }
