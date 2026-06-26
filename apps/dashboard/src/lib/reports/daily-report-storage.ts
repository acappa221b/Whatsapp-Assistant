import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config } from '@finance-ai/shared/config'
import { ChatMediaStorage } from '@finance-ai/shared/storage'
import type { DailyReportStorage } from '@finance-ai/core/domains/daily-report'
import type { WhatsappChatConfigRepository } from '@finance-ai/core/domains/whatsapp-chat-config'

export class FileDailyReportStorage implements DailyReportStorage {
  private readonly chatMediaStorage = new ChatMediaStorage(resolve(config.storage.mediaPath))

  constructor(private readonly chatConfigRepository: WhatsappChatConfigRepository) {}

  async saveMarkdown(chatId: string, reportDate: Date, content: string): Promise<string> {
    const configRow = await this.chatConfigRepository.findByChatId(chatId)
    const displayName = configRow?.name?.trim() || chatId
    const dateKey = reportDate.toISOString().slice(0, 10)
    const fileName = `${dateKey}.md`
    const resolved = await this.chatMediaStorage.resolvePath(
      chatId,
      displayName,
      'reports',
      fileName,
      configRow?.storageDir,
    )
    await writeFile(resolved.absolutePath, content, 'utf8')
    return resolved.storagePath
  }
}
