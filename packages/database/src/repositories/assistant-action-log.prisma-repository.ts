import type { PrismaClient } from '@prisma/client'
import type { AssistantActionLogPort } from '@finance-ai/core/domains/assistant-ops'

export class AssistantActionLogPrismaRepository implements AssistantActionLogPort {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: { action: string; chatIds: string[]; message: string }): Promise<void> {
    await this.prisma.assistantActionLog.create({
      data: {
        action: input.action,
        chatIds: input.chatIds,
        message: input.message,
      },
    })
  }

  async listRecent(limit = 10) {
    return this.prisma.assistantActionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
