import { isGenericDisplayName, isMoreInformativeName } from '@finance-ai/shared/utils'
import { buildChatDirName } from '@finance-ai/shared/storage'
import type { WhatsappChatConfig } from '../domain/whatsapp-chat-config.entity'
import type { WhatsappChatConfigRepository } from '../domain/whatsapp-chat-config.repository'

export type ChatNameResolutionResult = {
  chatId: string
  name: string | null
  source: string
}

export interface ChatNameResolverPort {
  resolve(chatId: string): Promise<ChatNameResolutionResult>
  getMostFrequentPushName?(chatId: string): Promise<string | null>
}

export type ResolveChatNamesResult = {
  resolved: number
  failed: string[]
  results: ChatNameResolutionResult[]
}

export type ResolveChatNamesOptions = {
  chatIds?: string[]
  force?: boolean
  onNameResolved?: (chatId: string, name: string) => Promise<void>
  ensureStorageDir?: (
    chatId: string,
    name: string,
    storageDir: string | null,
  ) => Promise<string>
}

export class ResolveChatNamesUseCase {
  constructor(
    private readonly repository: WhatsappChatConfigRepository,
    private readonly resolver: ChatNameResolverPort,
  ) {}

  async execute(options: ResolveChatNamesOptions = {}): Promise<ResolveChatNamesResult> {
    const configs = options.chatIds?.length
      ? (
          await Promise.all(
            options.chatIds.map((chatId) => this.repository.findByChatId(chatId)),
          )
        ).filter((config): config is WhatsappChatConfig => config !== null)
      : await this.repository.findAll()

    const results: ChatNameResolutionResult[] = []
    const failed: string[] = []
    let resolved = 0

    for (const config of configs) {
      if (
        !options.force &&
        config.name?.trim() &&
        !isGenericDisplayName(config.name)
      ) {
        results.push({ chatId: config.chatId, name: config.name, source: 'config' })
        continue
      }

      const resolution = await this.resolver.resolve(config.chatId)
      results.push(resolution)

      if (!resolution.name || isGenericDisplayName(resolution.name)) {
        failed.push(config.chatId)
        continue
      }

      let next = config
      if (isMoreInformativeName(resolution.name, config.name)) {
        next = config.withName(resolution.name)
      }

      const storageDir =
        (await options.ensureStorageDir?.(
          config.chatId,
          resolution.name,
          config.storageDir,
        )) ?? config.storageDir ?? buildChatDirName(resolution.name, config.chatId)

      if (storageDir !== config.storageDir) {
        next = next.withStorageDir(storageDir)
      }

      await this.repository.save(next)
      await options.onNameResolved?.(config.chatId, resolution.name)
      resolved += 1
    }

    return { resolved, failed, results }
  }
}
