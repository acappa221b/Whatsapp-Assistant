import type { PrismaClient, ApiUsageCategory as PrismaApiUsageCategory, Prisma } from '@prisma/client'
import type {
  ApiTokenUsageRecord,
  ApiTokenUsageRepository,
  RecordApiTokenUsageInput,
} from '@finance-ai/core/domains/api-token-usage'

export class ApiTokenUsagePrismaRepository implements ApiTokenUsageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async record(
    input: RecordApiTokenUsageInput & { costBrl: number; tokensTotal: number },
  ): Promise<ApiTokenUsageRecord> {
    const saved = await this.prisma.apiTokenUsage.create({
      data: {
        category: input.category as PrismaApiUsageCategory,
        chatId: input.chatId ?? null,
        messageId: input.messageId ?? null,
        model: input.model,
        tokensInput: input.tokensInput,
        tokensOutput: input.tokensOutput,
        tokensTotal: input.tokensTotal,
        costBrl: input.costBrl,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        occurredAt: input.occurredAt ?? new Date(),
      },
    })

    return {
      id: saved.id,
      occurredAt: saved.occurredAt,
      category: saved.category as ApiTokenUsageRecord['category'],
      chatId: saved.chatId,
      messageId: saved.messageId,
      model: saved.model,
      tokensInput: saved.tokensInput,
      tokensOutput: saved.tokensOutput,
      tokensTotal: saved.tokensTotal,
      costBrl: saved.costBrl,
      metadata: (saved.metadata ?? null) as Record<string, unknown> | null,
    }
  }
}
