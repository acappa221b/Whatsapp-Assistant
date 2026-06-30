import { NextResponse } from 'next/server'
import { settingsRepo } from '@/lib/ai/ai-provider-service'

function sanitizeSettings(settings: Awaited<ReturnType<typeof settingsRepo.get>>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { settingsEncryptionSecret, ...safe } = settings
  return {
    ...safe,
    updatedAt: safe.updatedAt.toISOString(),
  }
}

export async function GET() {
  const settings = await settingsRepo.get()
  return NextResponse.json(sanitizeSettings(settings))
}

type PatchBody = {
  appName?: string
  timezone?: string
  port?: number
  companyName?: string
  whatsappAutoReconnect?: boolean
  whatsappReconnectDelayMs?: number
  whatsappIgnoreHistory?: boolean
  syncGroupsEnabled?: boolean
  syncAddressBookEnabled?: boolean
  syncChatsMetadataEnabled?: boolean
  setupCompleted?: boolean
  reportAutoEnabled?: boolean
  reportAutoTime?: string
  reportTimezone?: string
  defaultChatProviderId?: string | null
  defaultTranscriptionProviderId?: string | null
  defaultVisionProviderId?: string | null
  defaultReportProviderId?: string | null
  defaultAssistantProviderId?: string | null
  updateCheckEnabled?: boolean
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as PatchBody
  const updated = await settingsRepo.update(body)
  return NextResponse.json(sanitizeSettings(updated))
}
