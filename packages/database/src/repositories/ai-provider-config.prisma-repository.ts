import type { AiProviderType, PrismaClient } from '@prisma/client'

export type AiProviderConfigRecord = {
  id: string
  provider: AiProviderType
  displayName: string
  apiKeyEnc: string
  model: string | null
  baseUrl: string | null
  isDefault: boolean
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateAiProviderInput = {
  provider: AiProviderType
  displayName: string
  apiKeyEnc: string
  model?: string | null
  baseUrl?: string | null
  isDefault?: boolean
  enabled?: boolean
}

export type UpdateAiProviderInput = Partial<
  Pick<CreateAiProviderInput, 'displayName' | 'apiKeyEnc' | 'model' | 'baseUrl' | 'isDefault' | 'enabled'>
>

export class AiProviderConfigPrismaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<AiProviderConfigRecord[]> {
    const rows = await this.prisma.aiProviderConfig.findMany({ orderBy: { createdAt: 'asc' } })
    return rows.map((row) => this.map(row))
  }

  async findById(id: string): Promise<AiProviderConfigRecord | null> {
    const row = await this.prisma.aiProviderConfig.findUnique({ where: { id } })
    return row ? this.map(row) : null
  }

  async create(input: CreateAiProviderInput): Promise<AiProviderConfigRecord> {
    if (input.isDefault) {
      await this.prisma.aiProviderConfig.updateMany({ data: { isDefault: false } })
    }
    const saved = await this.prisma.aiProviderConfig.create({
      data: {
        provider: input.provider,
        displayName: input.displayName,
        apiKeyEnc: input.apiKeyEnc,
        model: input.model ?? null,
        baseUrl: input.baseUrl ?? null,
        isDefault: input.isDefault ?? false,
        enabled: input.enabled ?? true,
      },
    })
    return this.map(saved)
  }

  async update(id: string, input: UpdateAiProviderInput): Promise<AiProviderConfigRecord> {
    if (input.isDefault) {
      await this.prisma.aiProviderConfig.updateMany({ data: { isDefault: false } })
    }
    const saved = await this.prisma.aiProviderConfig.update({
      where: { id },
      data: input,
    })
    return this.map(saved)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aiProviderConfig.delete({ where: { id } })
  }

  private map(row: {
    id: string
    provider: AiProviderType
    displayName: string
    apiKeyEnc: string
    model: string | null
    baseUrl: string | null
    isDefault: boolean
    enabled: boolean
    createdAt: Date
    updatedAt: Date
  }): AiProviderConfigRecord {
    return {
      id: row.id,
      provider: row.provider,
      displayName: row.displayName,
      apiKeyEnc: row.apiKeyEnc,
      model: row.model,
      baseUrl: row.baseUrl,
      isDefault: row.isDefault,
      enabled: row.enabled,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
