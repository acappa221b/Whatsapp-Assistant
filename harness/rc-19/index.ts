import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

export const Rc19Harness: Harness = {
  name: 'Rc19Harness',
  async run() {
    const errors: string[] = []

    for (const file of [
      'specs/rc-19-audio-bubble-provider-keys/README.md',
      'docs/investigations/2026-06-30-gemini-api-key-not-saving.md',
      'docs/releases/rc-19-audio-bubble-provider-keys.md',
      'packages/shared/src/utils/media-content-format.ts',
      'apps/dashboard/src/components/messages/audio-message-bubble.tsx',
      'apps/dashboard/src/components/settings/provider-settings-panel.tsx',
      'packages/database/tests/ai-provider-config.integration.test.ts',
    ]) {
      if (!existsSync(join(ROOT, file))) errors.push(`Missing ${file}`)
    }

    const mediaFormat = readFileSync(
      join(ROOT, 'packages/shared/src/utils/media-content-format.ts'),
      'utf-8',
    )
    if (!mediaFormat.includes('parseAudioMessageContent') || !mediaFormat.includes('AUDIO_DISPLAY_LABEL')) {
      errors.push('media-content-format must export parseAudioMessageContent and AUDIO_DISPLAY_LABEL')
    }

    const archiveView = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/messages/message-archive-view.tsx'),
      'utf-8',
    )
    if (!archiveView.includes('AudioMessageBubble')) {
      errors.push('message-archive-view must use AudioMessageBubble')
    }
    if (!archiveView.includes('audioProcessingEnabled')) {
      errors.push('message-archive-view must pass audioProcessingEnabled')
    }

    const providersPost = readFileSync(
      join(ROOT, 'apps/dashboard/src/app/api/settings/providers/route.ts'),
      'utf-8',
    )
    if (!providersPost.includes('bootstrapAppSettings')) {
      errors.push('providers POST must call bootstrapAppSettings')
    }
    if (!providersPost.includes('P2002')) {
      errors.push('providers POST must handle duplicate P2002')
    }

    const panel = readFileSync(
      join(ROOT, 'apps/dashboard/src/components/settings/provider-settings-panel.tsx'),
      'utf-8',
    )
    if (!panel.includes('!res.ok')) {
      errors.push('provider-settings-panel must check res.ok before clearing form')
    }
    if (!panel.includes("method: 'PATCH'")) {
      errors.push('provider-settings-panel must support PATCH edit')
    }

    const settings = readFileSync(join(ROOT, 'apps/dashboard/src/app/dashboard/settings/page.tsx'), 'utf-8')
    if (!settings.includes('ProviderSettingsPanel')) {
      errors.push('settings page must use ProviderSettingsPanel')
    }

    const manifest = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf-8')) as {
      version: string
    }
    if (!manifest.version.includes('rc19') && !manifest.version.startsWith('1.5.')) {
      errors.push('version.json should reflect RC-19 or newer')
    }

    const { parseAudioMessageContent } = await import(
      '../../packages/shared/src/utils/media-content-format.ts'
    )
    const parsed = parseAudioMessageContent('[ÁUDIO] teste')
    if (!parsed.isTranscribed || parsed.transcription !== 'teste') {
      errors.push('parseAudioMessageContent must extract transcription')
    }

    return createResult(this.name, errors)
  },
}

export const Rc19Harnesses = [Rc19Harness]
