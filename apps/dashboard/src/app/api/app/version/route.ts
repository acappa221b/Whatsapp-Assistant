import { NextResponse } from 'next/server'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import { checkForUpdates, resetUpdateCheckCache } from '@/lib/app/check-for-updates'
import { settingsRepo } from '@/lib/ai/ai-provider-service'

export async function GET(request: Request) {
  await bootstrapAppSettings()
  const { searchParams } = new URL(request.url)
  const force = searchParams.get('refresh') === '1'
  const result = await checkForUpdates({ force })
  return NextResponse.json(result)
}

type PatchBody = {
  dismiss?: boolean
  latestVersion?: string
}

export async function PATCH(request: Request) {
  await bootstrapAppSettings()
  const body = (await request.json()) as PatchBody
  if (body.dismiss && body.latestVersion) {
    await settingsRepo.update({ dismissedUpdateVersion: body.latestVersion })
    return NextResponse.json({ ok: true })
  }
  resetUpdateCheckCache()
  const result = await checkForUpdates({ force: true })
  return NextResponse.json(result)
}
