import { NotFoundError } from '../../../domain/errors'
import { generateId } from '../../../domain/utils'
import { DomainEvents, type EventBus } from '../../../events/index'
import type {
  AIExtractionProvider,
  AIExtractionResultInput,
  MediaExtractionInput,
  TextExtractionInput,
} from '../domain/ai-extraction-provider'
import { Extraction } from '../domain/extraction.entity'
import type { ExtractionRepository } from '../domain/extraction.repository'

export class CreateExtractionUseCase {
  constructor(
    private readonly repository: ExtractionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: {
    messageId: string
    type: AIExtractionResultInput['type']
    sourceType: AIExtractionResultInput['sourceType']
    confidence: number
    data: AIExtractionResultInput['data']
    processingTimeMs?: number | null
    tokensInput?: number | null
    tokensOutput?: number | null
    storagePath?: string | null
    model: string
  }): Promise<Extraction> {
    const extraction = Extraction.create({
      id: generateId(),
      messageId: input.messageId,
      type: input.type,
      sourceType: input.sourceType,
      confidence: input.confidence,
      data: input.data,
      processingTimeMs: input.processingTimeMs,
      tokensInput: input.tokensInput,
      tokensOutput: input.tokensOutput,
      storagePath: input.storagePath,
      model: input.model,
    })
    const saved = await this.repository.save(extraction)

    await this.eventBus.publish({
      name: saved.type === 'UNKNOWN' ? DomainEvents.ExtractionRejected : DomainEvents.ExtractionCreated,
      payload: {
        extractionId: saved.id,
        messageId: saved.messageId,
        type: saved.type,
        confidence: saved.confidence,
        model: saved.model,
      },
      occurredAt: new Date(),
    })

    return saved
  }
}

class ExtractCandidateUseCase {
  constructor(
    private readonly provider: AIExtractionProvider,
    private readonly createExtractionUseCase: CreateExtractionUseCase,
    private readonly eventBus: EventBus,
  ) {}

  protected async executeWith(
    runner: () => Promise<AIExtractionResultInput>,
    messageId: string,
  ): Promise<Extraction> {
    try {
      const result = await runner()
      return this.createExtractionUseCase.execute({
        messageId,
        type: result.type,
        sourceType: result.sourceType,
        confidence: result.confidence,
        data: result.data,
        processingTimeMs: result.processingTimeMs,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        storagePath: result.storagePath,
        model: result.model,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      await this.eventBus.publish({
        name: DomainEvents.ExtractionFailed,
        payload: {
          messageId,
          error: errorMessage,
        },
        occurredAt: new Date(),
      })
      throw error
    }
  }

  protected get extractionProvider(): AIExtractionProvider {
    return this.provider
  }
}

export class ExtractTextCandidateUseCase extends ExtractCandidateUseCase {
  async execute(input: TextExtractionInput): Promise<Extraction> {
    return this.executeWith(() => this.extractionProvider.extractText(input), input.messageId)
  }
}

export class ExtractImageCandidateUseCase extends ExtractCandidateUseCase {
  async execute(input: MediaExtractionInput): Promise<Extraction> {
    return this.executeWith(() => this.extractionProvider.extractImage(input), input.messageId)
  }
}

export class ExtractDocumentCandidateUseCase extends ExtractCandidateUseCase {
  async execute(input: MediaExtractionInput): Promise<Extraction> {
    return this.executeWith(() => this.extractionProvider.extractDocument(input), input.messageId)
  }
}

export class ExtractAudioCandidateUseCase extends ExtractCandidateUseCase {
  async execute(input: MediaExtractionInput): Promise<Extraction> {
    return this.executeWith(() => this.extractionProvider.extractAudio(input), input.messageId)
  }
}

export class GetExtractionUseCase {
  constructor(private readonly repository: ExtractionRepository) {}

  async execute(id: string): Promise<Extraction> {
    const extraction = await this.repository.findById(id)
    if (!extraction) throw new NotFoundError('Extraction', id)
    return extraction
  }
}

export class ListExtractionsUseCase {
  constructor(private readonly repository: ExtractionRepository) {}

  async execute(filters?: Parameters<ExtractionRepository['findMany']>[0]): Promise<Extraction[]> {
    return this.repository.findMany(filters)
  }
}
