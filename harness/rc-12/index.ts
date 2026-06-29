import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const Rc12SpecHarness: Harness = {
  name: 'Rc12SpecHarness',
  async run() {
    const errors: string[] = []
    for (const file of [
      'specs/rc-12-multimodal-assistant-settings/README.md',
      'specs/rc-12-multimodal-assistant-settings/acceptance-criteria.md',
      'specs/rc-12-multimodal-assistant-settings/test-matrix.md',
      'docs/adr/012-ai-provider-abstraction.md',
      'docs/adr/013-assistant-command-router.md',
      'docs/prompts/2025-06-26-rc-12-multimodal-assistant.md',
      'docs/releases/rc-12-multimodal-assistant-report.md',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }
    return createResult(this.name, errors)
  },
}

export const Rc12MultimodalHarness: Harness = {
  name: 'Rc12MultimodalHarness',
  async run() {
    const errors: string[] = []
    if (!existsSync(join(ROOT, 'packages/core/src/domains/audio-transcription/application/transcribe-audio.use-case.ts'))) {
      errors.push('Missing TranscribeAudioUseCase')
    }
    if (!existsSync(join(ROOT, 'packages/core/src/domains/photo-processing/application/process-photo.use-case.ts'))) {
      errors.push('Missing ProcessPhotoUseCase')
    }
    if (!existsSync(join(ROOT, 'packages/ai/src/providers/factory.ts'))) {
      errors.push('Missing AiProviderFactory')
    }
    const agent = read('packages/core/src/domains/agent-chat/application/process-agent-auto-reply.use-case.ts')
    if (!agent.includes("'AUDIO'") || !agent.includes("'IMAGE'") || !agent.includes('PHOTO_PENDING_AGENT_REPLY')) {
      errors.push('Agent must support AUDIO/IMAGE multimodal replies')
    }
    const pipeline = read('packages/core/src/domains/agent-chat/infrastructure/agent-auto-reply.pipeline.ts')
    if (!pipeline.includes('TranscriptionCompleted') || !pipeline.includes('PhotoProcessingCompleted')) {
      errors.push('AgentAutoReplyPipeline must subscribe media completion events')
    }
    const sidebar = read('apps/dashboard/src/components/layout/app-sidebar.tsx')
    if (!sidebar.includes('/dashboard/assistant') || !sidebar.includes('/dashboard/settings')) {
      errors.push('Sidebar must include Chat IA and Configurações')
    }
    const settingsApi = read('apps/dashboard/src/app/api/settings/providers/route.ts')
    if (settingsApi.includes('apiKey:') && settingsApi.includes('GET')) {
      // masked only in response mapping
    }
    if (!settingsApi.includes('apiKeyMasked')) {
      errors.push('Settings providers API must mask apiKey')
    }
    const job = read('apps/dashboard/src/lib/jobs/daily-report.job.ts')
    if (job.includes('getHours() !== 23') || job.includes('23:55')) {
      errors.push('Daily report job must use configurable reportAutoTime')
    }
    return createResult(this.name, errors)
  },
}

export const Rc12Harnesses = [Rc12SpecHarness, Rc12MultimodalHarness]
