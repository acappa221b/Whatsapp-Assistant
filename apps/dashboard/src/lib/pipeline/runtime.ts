import { InMemoryEventBus } from '@finance-ai/core/events'
import {
  DefaultProcessorResolver,
  EnqueueMessageUseCase,
  InMemoryMessageProcessingJobRepository,
  InMemoryMessageProcessingQueue,
  ListProcessingJobsUseCase,
  MessageProcessingPipeline,
  MessageTypeClassifier,
  ProcessMessageUseCase,
  RequeueMessageUseCase,
  SkipMessageProcessingUseCase,
  AudioMessageProcessor,
  DocumentMessageProcessor,
  ImageMessageProcessor,
  TextMessageProcessor,
  UnknownMessageProcessor,
} from '@finance-ai/core/domains/message-processing'
import {
  CreateExtractionUseCase,
  ExtractAudioCandidateUseCase,
  ExtractDocumentCandidateUseCase,
  ExtractImageCandidateUseCase,
  ExtractTextCandidateUseCase,
  ListExtractionsUseCase,
} from '@finance-ai/core/domains/extraction'
import { OpenAIExtractionProvider } from '@finance-ai/ai'
import { MediaDownloader } from '@finance-ai/whatsapp/media'
import {
  ExtractionPrismaRepository,
  prisma,
  WhatsappChatConfigPrismaRepository,
  WhatsappMessagePrismaRepository,
} from '@finance-ai/database'
import { getWhatsappRuntime } from '@/lib/whatsapp/runtime'

type PipelineRuntime = {
  eventBus: InMemoryEventBus
  jobRepository: InMemoryMessageProcessingJobRepository
  queue: InMemoryMessageProcessingQueue
  whatsappRepository: WhatsappMessagePrismaRepository
  chatConfigRepository: WhatsappChatConfigPrismaRepository
  extractionRepository: ExtractionPrismaRepository
  enqueueUseCase: EnqueueMessageUseCase
  skipMessageUseCase: SkipMessageProcessingUseCase
  processMessageUseCase: ProcessMessageUseCase
  requeueUseCase: RequeueMessageUseCase
  listJobsUseCase: ListProcessingJobsUseCase
  listExtractionsUseCase: ListExtractionsUseCase
}

const globalForPipeline = globalThis as unknown as {
  pipelineRuntime?: PipelineRuntime
  pipelineRegistered?: boolean
}

function createPipelineRuntime(eventBus: InMemoryEventBus): PipelineRuntime {
  const jobRepository = new InMemoryMessageProcessingJobRepository()
  const queue = new InMemoryMessageProcessingQueue()
  const whatsappRepository = new WhatsappMessagePrismaRepository(prisma)
  const chatConfigRepository = new WhatsappChatConfigPrismaRepository(prisma)
  const extractionRepository = new ExtractionPrismaRepository(prisma)
  const classifier = new MessageTypeClassifier()
  const aiProvider = new OpenAIExtractionProvider()
  const mediaDownloader = new MediaDownloader()
  const createExtractionUseCase = new CreateExtractionUseCase(extractionRepository, eventBus)
  const extractTextUseCase = new ExtractTextCandidateUseCase(
    aiProvider,
    createExtractionUseCase,
    eventBus,
  )
  const extractImageUseCase = new ExtractImageCandidateUseCase(
    aiProvider,
    createExtractionUseCase,
    eventBus,
  )
  const extractDocumentUseCase = new ExtractDocumentCandidateUseCase(
    aiProvider,
    createExtractionUseCase,
    eventBus,
  )
  const extractAudioUseCase = new ExtractAudioCandidateUseCase(
    aiProvider,
    createExtractionUseCase,
    eventBus,
  )
  const resolver = new DefaultProcessorResolver([
    new TextMessageProcessor(extractTextUseCase),
    new ImageMessageProcessor(extractImageUseCase, createExtractionUseCase, mediaDownloader),
    new DocumentMessageProcessor(extractDocumentUseCase, createExtractionUseCase, mediaDownloader),
    new AudioMessageProcessor(extractAudioUseCase),
    new UnknownMessageProcessor(),
  ])

  const enqueueUseCase = new EnqueueMessageUseCase(jobRepository, queue, eventBus)
  const skipMessageUseCase = new SkipMessageProcessingUseCase(jobRepository, eventBus)
  const processMessageUseCase = new ProcessMessageUseCase(
    jobRepository,
    whatsappRepository,
    queue,
    classifier,
    resolver,
    eventBus,
    chatConfigRepository,
  )
  const requeueUseCase = new RequeueMessageUseCase(
    jobRepository,
    queue,
    processMessageUseCase,
    eventBus,
  )
  const listJobsUseCase = new ListProcessingJobsUseCase(jobRepository)
  const listExtractionsUseCase = new ListExtractionsUseCase(extractionRepository)

  return {
    eventBus,
    jobRepository,
    queue,
    whatsappRepository,
    chatConfigRepository,
    extractionRepository,
    enqueueUseCase,
    skipMessageUseCase,
    processMessageUseCase,
    requeueUseCase,
    listJobsUseCase,
    listExtractionsUseCase,
  }
}

export function getPipelineRuntime(): PipelineRuntime {
  const whatsappRuntime = getWhatsappRuntime()

  if (!globalForPipeline.pipelineRuntime) {
    globalForPipeline.pipelineRuntime = createPipelineRuntime(whatsappRuntime.eventBus)
  }

  return globalForPipeline.pipelineRuntime
}

export function ensureProcessingPipelineRegistered(): void {
  if (globalForPipeline.pipelineRegistered) return

  const runtime = getPipelineRuntime()
  const pipeline = new MessageProcessingPipeline(
    runtime.eventBus,
    runtime.whatsappRepository,
    runtime.chatConfigRepository,
    runtime.enqueueUseCase,
    runtime.processMessageUseCase,
    runtime.skipMessageUseCase,
  )
  pipeline.register()
  globalForPipeline.pipelineRegistered = true
}
