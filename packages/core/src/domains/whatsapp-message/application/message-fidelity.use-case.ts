export type MessageFidelityMetrics = {
  totalMessages: number
  extractedTexts: number
  textEmpty: number
  imagesTotal: number
  imagesWithCaption: number
  imagesWithoutCaption: number
  imagesProcessed: number
  imagesWithoutExtraction: number
  chatsResolved: number
  chatsFallback: number
  senderResolved: number
  senderFallback: number
  textExtractionRate: number
  contactResolutionRate: number
  imageExtractionRate: number
}

export class GetMessageFidelityMetricsUseCase {
  constructor(
    private readonly repository: {
      getFidelityMetrics(): Promise<MessageFidelityMetrics>
    },
  ) {}

  async execute(): Promise<MessageFidelityMetrics> {
    return this.repository.getFidelityMetrics()
  }
}
