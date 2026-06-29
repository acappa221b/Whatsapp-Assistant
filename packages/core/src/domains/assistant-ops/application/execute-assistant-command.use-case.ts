import type { ResolvedTarget } from '../domain/assistant-command.types'

export type WhatsappSendPort = {
  sendMessage(input: { to: string; content: string }): Promise<void>
  isConnected(): boolean
}

export type AssistantActionLogPort = {
  record(input: { action: string; chatIds: string[]; message: string }): Promise<void>
}

export class ExecuteAssistantCommandUseCase {
  constructor(
    private readonly whatsapp: WhatsappSendPort,
    private readonly actionLog: AssistantActionLogPort,
  ) {}

  async execute(input: {
    text: string
    targets: ResolvedTarget[]
    delayMs?: number
  }): Promise<{ sent: number; chatIds: string[] }> {
    if (!this.whatsapp.isConnected()) {
      throw new Error('WhatsApp desconectado. Conecte em WhatsApp antes de enviar.')
    }

    const chatIds: string[] = []
    const delay = input.delayMs ?? 400

    for (const target of input.targets) {
      if (!target.archiveEnabled) continue
      await this.whatsapp.sendMessage({ to: target.chatId, content: input.text })
      chatIds.push(target.chatId)
      if (chatIds.length < input.targets.length) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    await this.actionLog.record({
      action: chatIds.length > 1 ? 'broadcast' : 'send_message',
      chatIds,
      message: input.text,
    })

    return { sent: chatIds.length, chatIds }
  }
}
