import type { WhatsappChatConfigRepository } from '../domain/whatsapp-chat-config.repository'

export type PruneOrphanChatConfigsInput = {
  includeGroups?: boolean
  dryRun?: boolean
}

export type PruneOrphanChatConfigsResult = {
  dryRun: boolean
  removed: number
  total: number
  groupCount: number
  chatIds: string[]
}

export class PruneOrphanChatConfigsUseCase {
  constructor(private readonly repository: WhatsappChatConfigRepository) {}

  async execute(input: PruneOrphanChatConfigsInput = {}): Promise<PruneOrphanChatConfigsResult> {
    const includeGroups = input.includeGroups ?? true
    const dryRun = input.dryRun ?? true
    const preview = await this.repository.findOrphanChatIds(includeGroups)

    if (dryRun || preview.chatIds.length === 0) {
      return {
        dryRun: true,
        removed: 0,
        total: preview.total,
        groupCount: preview.groupCount,
        chatIds: preview.chatIds,
      }
    }

    const removed = await this.repository.deleteByChatIds(preview.chatIds)
    return {
      dryRun: false,
      removed,
      total: preview.total,
      groupCount: preview.groupCount,
      chatIds: preview.chatIds,
    }
  }
}

export class ListWhatsappChatConfigsPaginatedUseCase {
  constructor(private readonly repository: WhatsappChatConfigRepository) {}

  execute(filters: Parameters<WhatsappChatConfigRepository['findPaginated']>[0]) {
    return this.repository.findPaginated(filters)
  }
}
