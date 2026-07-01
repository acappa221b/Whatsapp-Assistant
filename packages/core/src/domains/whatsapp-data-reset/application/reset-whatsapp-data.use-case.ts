export type ResetWhatsappDataResult = {
  deletedMessages: number
  deletedChats: number
  deletedReports: number
  mediaFilesRemoved: number
}

export type ResetWhatsappDataPort = {
  deleteWhatsappData(): Promise<{
    deletedMessages: number
    deletedChats: number
    deletedReports: number
  }>
  clearMediaStorage(): Promise<number>
}

export type ResetWhatsappDataCallbacks = {
  onAfterReset?: () => Promise<void>
  log?: (message: string, meta: Record<string, unknown>) => void
}

export class ResetWhatsappDataUseCase {
  constructor(
    private readonly port: ResetWhatsappDataPort,
    private readonly callbacks: ResetWhatsappDataCallbacks = {},
  ) {}

  async execute(): Promise<ResetWhatsappDataResult> {
    const deleted = await this.port.deleteWhatsappData()
    const mediaFilesRemoved = await this.port.clearMediaStorage()
    await this.callbacks.onAfterReset?.()
    this.callbacks.log?.('[whatsapp] Dados resetados', {
      deletedMessages: deleted.deletedMessages,
      deletedChats: deleted.deletedChats,
      deletedReports: deleted.deletedReports,
      mediaFilesRemoved,
    })
    return {
      deletedMessages: deleted.deletedMessages,
      deletedChats: deleted.deletedChats,
      deletedReports: deleted.deletedReports,
      mediaFilesRemoved,
    }
  }
}
