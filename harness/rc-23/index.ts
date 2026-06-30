import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc23Harness: Harness = {
  name: 'Rc23Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-23-audio-transcription-fix/README.md',
      'docs/investigations/2026-06-30-audio-transcription-stuck.md',
      'docs/releases/rc-23-audio-transcription-fix.md',
      'packages/core/src/domains/audio-transcription/application/retry-pending-audio-transcriptions.use-case.ts',
      'apps/dashboard/src/app/api/whatsapp/messages/[id]/retry-transcription/route.ts',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const aiService = readFileSync(
      join(ROOT, 'apps/dashboard/src/lib/ai/ai-provider-service.ts'),
      'utf-8',
    )
    if (!aiService.includes('resolveTranscriptionCredentials')) {
      errors.push('ai-provider-service must define resolveTranscriptionCredentials')
    }
    if (!aiService.includes("TRANSCRIPTION_CAPABLE")) {
      errors.push('ai-provider-service must filter transcription providers')
    }

    const events = readFileSync(join(ROOT, 'packages/core/src/events/index.ts'), 'utf-8')
    if (!events.includes('TranscriptionFailed')) {
      errors.push('DomainEvents must include TranscriptionFailed')
    }

    const repo = readFileSync(
      join(ROOT, 'packages/database/src/repositories/whatsapp-message.prisma-repository.ts'),
      'utf-8',
    )
    if (!repo.includes('updateStoragePath')) {
      errors.push('whatsapp message repo must implement updateStoragePath')
    }

    const transcribe = readFileSync(
      join(ROOT, 'packages/core/src/domains/audio-transcription/application/transcribe-audio.use-case.ts'),
      'utf-8',
    )
    if (!transcribe.includes('TranscriptionFailed')) {
      errors.push('TranscribeAudioUseCase must publish TranscriptionFailed')
    }
    if (!transcribe.includes('formatAudioTranscriptionFailed')) {
      errors.push('TranscribeAudioUseCase must write failed content marker')
    }

    const bubble = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/messages/audio-message-bubble.tsx'),
      'utf-8',
    )
    if (!bubble.includes('Tentar novamente')) {
      errors.push('AudioMessageBubble must offer retry action')
    }
    if (!bubble.includes('Nao foi possivel transcrever')) {
      errors.push('AudioMessageBubble must show friendly failure message')
    }

    const mediaPipeline = readFileSync(
      join(ROOT, 'packages/core/src/domains/message-processing/infrastructure/media-processing.pipeline.ts'),
      'utf-8',
    )
    if (mediaPipeline.includes('await this.onAudioProcessing')) {
      errors.push('media-processing must fire-and-forget audio processing')
    }

    const mediaFormat = readFileSync(
      join(ROOT, 'packages/shared/src/utils/media-content-format.ts'),
      'utf-8',
    )
    if (!mediaFormat.includes('AUDIO_TRANSCRIPTION_FAILED_PREFIX')) {
      errors.push('media-content-format must define AUDIO_TRANSCRIPTION_FAILED_PREFIX')
    }

    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8')
    if (!readme.toLowerCase().includes('whisper')) {
      errors.push('README must mention Whisper for transcription')
    }

    return createResult(this.name, errors)
  },
}

export const Rc23Harnesses = [Rc23Harness]
