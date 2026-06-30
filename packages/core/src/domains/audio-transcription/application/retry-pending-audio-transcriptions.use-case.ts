import type { WhatsappMessageRepository } from '../../whatsapp-message/domain/whatsapp-message.repository'
import type { TranscribeAudioUseCase } from '../../audio-transcription/application/transcribe-audio.use-case'

const DEFAULT_LOOKBACK_MS = 72 * 60 * 60 * 1000
const DEFAULT_BATCH_LIMIT = 20

export type RetryPendingAudioTranscriptionsInput = {
  chatId?: string
  since?: Date
  limit?: number
  includeFailed?: boolean
}

export class RetryPendingAudioTranscriptionsUseCase {
  constructor(
    private readonly messageRepository: WhatsappMessageRepository,
    private readonly transcribeAudioUseCase: TranscribeAudioUseCase,
  ) {}

  async execute(input: RetryPendingAudioTranscriptionsInput = {}): Promise<{ retried: number }> {
    const since = input.since ?? new Date(Date.now() - DEFAULT_LOOKBACK_MS)
    const limit = input.limit ?? DEFAULT_BATCH_LIMIT

    const pending = await this.messageRepository.findPendingAudioTranscriptions({
      chatId: input.chatId,
      since,
      limit,
      includeFailed: input.includeFailed,
    })

    for (const message of pending) {
      await this.transcribeAudioUseCase.execute(message.id)
    }

    if (pending.length > 0) {
      console.info('[RetryPendingAudioTranscriptions] retried', {
        count: pending.length,
        chatId: input.chatId ?? null,
      })
    }

    return { retried: pending.length }
  }
}
