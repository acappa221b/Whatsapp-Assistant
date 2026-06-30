import { randomUUID } from 'node:crypto'
import type { WhatsappChatConfigRepository } from '../../whatsapp-chat-config/domain/whatsapp-chat-config.repository'
import type { StoreWhatsappMessageUseCase } from '../application/whatsapp-message.use-cases'

export const BROADCAST_DELAY_MS = 2000
export const BROADCAST_MAX_CHATS = 50

export type BroadcastWhatsappMessageInput = {
  chatIds: string[]
  content: string
}

export type BroadcastWhatsappMessageResult = {
  sent: number
  failed: Array<{ chatId: string; error: string }>
  results: Array<{ chatId: string; ok: boolean; messageId?: string; error?: string }>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class BroadcastWhatsappMessageUseCase {
  constructor(
    private readonly chatConfigRepository: WhatsappChatConfigRepository,
    private readonly sendMessage: (input: { to: string; content: string }) => Promise<void>,
    private readonly storeUseCase: StoreWhatsappMessageUseCase,
    private readonly isConnected: () => boolean,
  ) {}

  async execute(input: BroadcastWhatsappMessageInput): Promise<BroadcastWhatsappMessageResult> {
    if (!this.isConnected()) {
      throw new Error('WhatsApp desconectado')
    }

    const content = input.content.trim()
    if (!content) {
      throw new Error('content is required')
    }
    if (input.chatIds.length === 0) {
      throw new Error('chatIds is required')
    }
    if (input.chatIds.length > BROADCAST_MAX_CHATS) {
      throw new Error(`Máximo ${BROADCAST_MAX_CHATS} chats por envio`)
    }

    const failed: BroadcastWhatsappMessageResult['failed'] = []
    const results: BroadcastWhatsappMessageResult['results'] = []
    let sent = 0

    for (let index = 0; index < input.chatIds.length; index++) {
      const chatId = input.chatIds[index]!
      const config = await this.chatConfigRepository.findByChatId(chatId)
      if (!config?.archiveEnabled) {
        const error = 'Chat não habilitado'
        failed.push({ chatId, error })
        results.push({ chatId, ok: false, error })
        continue
      }

      try {
        await this.sendMessage({ to: chatId, content })
        const saved = await this.storeUseCase.execute({
          externalMessageId: `broadcast-${randomUUID()}`,
          chatId,
          chatName: config.name,
          sender: 'me',
          senderId: chatId,
          senderName: 'Você',
          content,
          messageType: 'TEXT',
          rawPayload: { source: 'multi-mensagem-broadcast' },
          fromMe: true,
          receivedAt: new Date(),
        })
        sent += 1
        results.push({ chatId, ok: true, messageId: saved.id })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        failed.push({ chatId, error: message })
        results.push({ chatId, ok: false, error: message })
      }

      if (index < input.chatIds.length - 1) {
        await sleep(BROADCAST_DELAY_MS)
      }
    }

    return { sent, failed, results }
  }
}
