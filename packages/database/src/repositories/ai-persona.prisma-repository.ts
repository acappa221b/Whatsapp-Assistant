import type { Prisma, PrismaClient } from '@prisma/client'

export type AiPersonaRecord = {
  id: string
  usageMode: 'personal' | 'business'
  presetId: string
  toneFormal: number
  responseLength: number
  useEmojis: boolean
  customInstructions: string
  exampleReplies: string[]
  behaviorFlags: Record<string, boolean>
  salesPlaybook: string
  learnFromHistory: boolean
  historySampleLimit: number
  createdAt: Date
  updatedAt: Date
}

export type UpdateAiPersonaInput = Partial<
  Omit<AiPersonaRecord, 'id' | 'createdAt' | 'updatedAt'>
>

export class AiPersonaPrismaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async ensureDefault(): Promise<AiPersonaRecord> {
    const existing = await this.prisma.aiPersonaProfile.findUnique({ where: { id: 'default' } })
    if (existing) return this.map(existing)
    const created = await this.prisma.aiPersonaProfile.create({ data: { id: 'default' } })
    return this.map(created)
  }

  async getDefault(): Promise<AiPersonaRecord> {
    return this.ensureDefault()
  }

  async update(input: UpdateAiPersonaInput): Promise<AiPersonaRecord> {
    await this.ensureDefault()
    const saved = await this.prisma.aiPersonaProfile.update({
      where: { id: 'default' },
      data: {
        ...input,
        exampleReplies: input.exampleReplies as Prisma.InputJsonValue | undefined,
        behaviorFlags: input.behaviorFlags as Prisma.InputJsonValue | undefined,
      },
    })
    return this.map(saved)
  }

  private map(row: {
    id: string
    usageMode: string
    presetId: string
    toneFormal: number
    responseLength: number
    useEmojis: boolean
    customInstructions: string
    exampleReplies: unknown
    behaviorFlags: unknown
    salesPlaybook: string
    learnFromHistory: boolean
    historySampleLimit: number
    createdAt: Date
    updatedAt: Date
  }): AiPersonaRecord {
    return {
      id: row.id,
      usageMode: row.usageMode === 'business' ? 'business' : 'personal',
      presetId: row.presetId,
      toneFormal: row.toneFormal,
      responseLength: row.responseLength,
      useEmojis: row.useEmojis,
      customInstructions: row.customInstructions,
      exampleReplies: Array.isArray(row.exampleReplies)
        ? row.exampleReplies.filter((item): item is string => typeof item === 'string')
        : [],
      behaviorFlags:
        row.behaviorFlags && typeof row.behaviorFlags === 'object' && !Array.isArray(row.behaviorFlags)
          ? (row.behaviorFlags as Record<string, boolean>)
          : {},
      salesPlaybook: row.salesPlaybook,
      learnFromHistory: row.learnFromHistory,
      historySampleLimit: row.historySampleLimit,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
