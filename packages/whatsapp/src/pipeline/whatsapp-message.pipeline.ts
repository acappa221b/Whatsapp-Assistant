import type { EventBus } from '@finance-ai/core/events'
import { DomainEvents } from '@finance-ai/core/events'
import type { StoreWhatsappMessageInput } from '@finance-ai/core/domains/whatsapp-message'
import { StoreWhatsappMessageUseCase } from '@finance-ai/core/domains/whatsapp-message'
import type { EnsureWhatsappChatDiscoveredUseCase } from '@finance-ai/core/domains/whatsapp-chat-config'
import {
  logRc02ChatUpsertFailed,
  logRc02ChatUpsertStart,
  logRc02ChatUpsertSuccess,
  logRc02MessageUpsertFailed,
  logRc02MessageUpsertSuccess,
  resolveChatType,
} from '../utils/rc-02-diagnostic'
import { recordMessagePersisted, recordMessagePersistFailed } from '../metrics/capture-metrics'
import { logRc07 } from '@finance-ai/shared/utils'

export class WhatsappMessagePipeline {
  constructor(
    private readonly eventBus: EventBus,
    private readonly ensureChatDiscoveredUseCase: EnsureWhatsappChatDiscoveredUseCase,
    private readonly storeUseCase: StoreWhatsappMessageUseCase,
    private readonly resolveChatName?: (
      chatId: string,
      hint?: string | null,
    ) => Promise<string | null>,
    private readonly transformIncoming?: (
      payload: StoreWhatsappMessageInput,
    ) => Promise<StoreWhatsappMessageInput>,
  ) {}

  register(): () => void {
    return this.eventBus.subscribe(DomainEvents.WhatsappMessageReceived, async (event) => {
      const payload = event.payload as StoreWhatsappMessageInput
      logRc02ChatUpsertStart({
        chatId: payload.chatId,
        chatType: resolveChatType(payload.chatId),
        messageId: payload.externalMessageId,
      })
      try {
        let chatName = payload.chatName
        if (!chatName?.trim() && this.resolveChatName) {
          const resolved = await this.resolveChatName(payload.chatId, payload.chatName)
          if (resolved?.trim()) chatName = resolved
        }
        await this.ensureChatDiscoveredUseCase.execute(payload.chatId, chatName)
        logRc02ChatUpsertSuccess({
          chatId: payload.chatId,
          chatType: resolveChatType(payload.chatId),
        })
        const storeInput = this.transformIncoming
          ? await this.transformIncoming({ ...payload, chatName })
          : { ...payload, chatName }
        const saved = await this.storeUseCase.execute(storeInput)
        recordMessagePersisted()
        logRc07('PERSIST', {
          chatId: payload.chatId,
          messageId: payload.externalMessageId,
          persistedId: saved.id,
          messageType: payload.messageType,
        })
        logRc02MessageUpsertSuccess({
          chatId: payload.chatId,
          chatType: resolveChatType(payload.chatId),
          messageId: payload.externalMessageId,
          persistedId: saved.id,
        })
      } catch (error) {
        const payload = event.payload as StoreWhatsappMessageInput
        recordMessagePersistFailed()
        logRc07('PERSIST', {
          event: 'failed',
          chatId: payload.chatId,
          messageId: payload.externalMessageId,
          error: error instanceof Error ? error.message : String(error),
        })
        logRc02MessageUpsertFailed({
          chatId: payload.chatId,
          chatType: resolveChatType(payload.chatId),
          messageId: payload.externalMessageId,
          error: error instanceof Error ? error.message : String(error),
        })
        logRc02ChatUpsertFailed({
          chatId: payload.chatId,
          chatType: resolveChatType(payload.chatId),
          error: error instanceof Error ? error.message : String(error),
        })
        await this.eventBus.publish({
          name: DomainEvents.WhatsappMessageFailed,
          payload: {
            externalMessageId: payload.externalMessageId,
            chatId: payload.chatId,
            error: error instanceof Error ? error.message : String(error),
          },
          occurredAt: new Date(),
        })
      }
    })
  }
}
