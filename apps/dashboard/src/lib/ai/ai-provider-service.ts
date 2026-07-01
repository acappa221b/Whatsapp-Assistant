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
import { OpenAIChatProvider, UnifiedAgentChatProvider, type TokenUsageCallback } from '@finance-ai/ai'
import { OpenAIDailyReportProvider } from '@finance-ai/ai'
import { getSettingsEncryptionSecret } from '@/lib/bootstrap/app-settings'

const settingsRepo = new AppSettingsPrismaRepository(prisma)
const providerRepo = new AiProviderConfigPrismaRepository(prisma)

const TRANSCRIPTION_CAPABLE = new Set(['openai', 'custom'])

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

async function decryptProviderRow(
  row: Awaited<ReturnType<AiProviderConfigPrismaRepository['findAll']>>[number],
): Promise<ProviderCredentials | null> {
  try {
    const apiKey = decryptSecret(row.apiKeyEnc, await encryptionSecret())
    return {
      provider: row.provider,
      apiKey,
      model: row.model,
      baseUrl: row.baseUrl,
    }
  } catch (error) {
    console.error('[AiProvider] decrypt failed', { id: row.id, error })
    return null
  }
}

export async function resolveTranscriptionCredentials(): Promise<ProviderCredentials | null> {
  const settings = await settingsRepo.get()
  const providers = (await providerRepo.findAll()).filter((provider) => provider.enabled)

  const preferred = settings.defaultTranscriptionProviderId
    ? providers.find((provider) => provider.id === settings.defaultTranscriptionProviderId)
    : null

  const candidates = [preferred, providers.find((provider) => provider.isDefault), ...providers].filter(
    (provider, index, list) => provider && list.indexOf(provider) === index,
  ) as typeof providers

  for (const row of candidates) {
    if (!TRANSCRIPTION_CAPABLE.has(row.provider)) continue
    const creds = await decryptProviderRow(row)
    if (creds) return creds
  }

  return null
}

async function resolveCredentials(capability: AiCapability): Promise<ProviderCredentials | null> {
  if (capability === 'transcription') {
    return resolveTranscriptionCredentials()
  }

  const settings = await settingsRepo.get()
  const providers = await providerRepo.findAll()
  const preferredId = capabilityProviderId(settings, capability)
  const selected =
    (preferredId ? providers.find((p) => p.id === preferredId && p.enabled) : null) ??
    providers.find((p) => p.enabled && p.isDefault) ??
    providers.find((p) => p.enabled)

  if (selected) {
    return decryptProviderRow(selected)
  }

  return null
}

export async function hasAiProvider(capability: AiCapability): Promise<boolean> {
  return Boolean(await resolveCredentials(capability))
}

export async function getAssistantProviderCredentials(): Promise<ProviderCredentials | null> {
  return resolveCredentials('assistant')
}

export async function getUnifiedProvider(capability: AiCapability): Promise<UnifiedAiProvider | null> {
  const creds = await resolveCredentials(capability)
  if (!creds) return null
  return createUnifiedProvider(creds)
}

export async function createAgentChatProvider(
  onTokenUsage?: TokenUsageCallback,
): Promise<OpenAIChatProvider | UnifiedAgentChatProvider | null> {
  const creds = await resolveCredentials('chat')
  if (!creds) return null
  if (creds.provider === 'openai') {
    return new OpenAIChatProvider({
      apiKey: creds.apiKey,
      model: creds.model ?? config.openai.model,
      onTokenUsage,
    })
  }
  return new UnifiedAgentChatProvider(creds, onTokenUsage)
}

export async function createDailyReportProvider(): Promise<OpenAIDailyReportProvider | null> {
  const creds = await resolveCredentials('report')
  if (!creds) return null
  return new OpenAIDailyReportProvider({
    apiKey: creds.apiKey,
    model: creds.model ?? config.openai.model,
  })
}

export { settingsRepo, providerRepo, encryptionSecret, encryptSecret, TRANSCRIPTION_CAPABLE }
