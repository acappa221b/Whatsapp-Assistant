import { NextResponse } from 'next/server'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'
import {
  mapPersona,
  personaRepo,
} from '@/lib/ai-training/ai-training-service'
import { prisma } from '@finance-ai/database'

export async function GET() {
  await bootstrapAppSettings()
  const persona = await personaRepo.getDefault()
  const historySamples = await prisma.whatsappMessage.findMany({
    where: { fromMe: true },
    orderBy: { receivedAt: 'desc' },
    take: 3,
    select: { content: true },
  })

  return NextResponse.json({
    ...mapPersona(persona),
    updatedAt: persona.updatedAt.toISOString(),
    historyPreview: historySamples.map((row) => row.content.trim()).filter(Boolean),
  })
}

type PatchBody = {
  usageMode?: 'personal' | 'business'
  presetId?: string
  toneFormal?: number
  responseLength?: number
  useEmojis?: boolean
  customInstructions?: string
  exampleReplies?: string[]
  behaviorFlags?: Record<string, boolean>
  salesPlaybook?: string
  learnFromHistory?: boolean
  historySampleLimit?: number
}

export async function PATCH(request: Request) {
  await bootstrapAppSettings()
  const body = (await request.json()) as PatchBody
  const updated = await personaRepo.update(body)
  return NextResponse.json({
    ...mapPersona(updated),
    updatedAt: updated.updatedAt.toISOString(),
  })
}
