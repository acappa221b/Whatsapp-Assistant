import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const EPIC = join(ROOT, 'specs/epic-assistant-01')

const MODULES = [
  'message-archive',
  'audio-transcription',
  'messages-inbox',
  'dashboard-summary',
  'whatsapp-connection',
] as const

const REQUIRED_EPIC_SECTIONS = ['## Objetivo', '## Escopo IN', '## Escopo OUT', '## Critérios de aceite']

const REQUIRED_MODULE_SECTIONS = ['## Objetivo', '## Critérios de Aceite']

function read(path: string): string {
  return readFileSync(path, 'utf-8')
}

export const Assistant01SpecHarness: Harness = {
  name: 'Assistant01SpecHarness',
  async run() {
    const errors: string[] = []

    const epicReadme = join(EPIC, 'README.md')
    if (!existsSync(epicReadme)) {
      errors.push('Missing specs/epic-assistant-01/README.md')
      return createResult(this.name, errors)
    }

    const epicContent = read(epicReadme)
    for (const section of REQUIRED_EPIC_SECTIONS) {
      if (!epicContent.includes(section)) {
        errors.push(`epic-assistant-01 README missing: ${section}`)
      }
    }

    if (!epicContent.includes('SPEC ONLY')) {
      errors.push('epic-assistant-01 must be marked SPEC ONLY until implementation approved')
    }

    for (const mod of MODULES) {
      const path = join(EPIC, mod, 'README.md')
      if (!existsSync(path)) {
        errors.push(`Missing specs/epic-assistant-01/${mod}/README.md`)
        continue
      }
      const content = read(path)
      for (const section of REQUIRED_MODULE_SECTIONS) {
        if (!content.includes(section)) {
          errors.push(`${mod}: missing ${section}`)
        }
      }
      if (!content.includes('Given') || !content.includes('Then')) {
        errors.push(`${mod}: acceptance criteria must use Given/When/Then`)
      }
    }

    for (const file of ['test-matrix.md', 'events-catalog.md', 'adr-impact.md', 'reports-module-spec.md']) {
      if (!existsSync(join(EPIC, file))) {
        errors.push(`Missing specs/epic-assistant-01/${file}`)
      }
    }

    const matrix = read(join(EPIC, 'test-matrix.md'))
    if (!matrix.includes('ASST-001') || !matrix.includes('ASST-025')) {
      errors.push('test-matrix.md incomplete (ASST-001..ASST-025)')
    }

    return createResult(this.name, errors)
  },
}

export const Assistant01PlanningHarness: Harness = {
  name: 'Assistant01PlanningHarness',
  async run() {
    const errors: string[] = []

    const requiredDocs = [
      'docs/product/vision.md',
      'docs/refactor/deprecated-modules.md',
      'docs/refactor/migration-plan.md',
      'docs/architecture/assistant-overview.md',
      'docs/adr/009-product-pivot-whatsapp-assistant.md',
      'docs/whisper/transcription.md',
    ]

    for (const doc of requiredDocs) {
      if (!existsSync(join(ROOT, doc))) {
        errors.push(`Missing planning doc: ${doc}`)
      }
    }

    const deprecated = existsSync(join(ROOT, 'docs/refactor/deprecated-modules.md'))
      ? read('docs/refactor/deprecated-modules.md')
      : ''
    for (const item of ['Expense', 'Pipeline Financeiro', 'epic-assistant-01']) {
      if (!deprecated.includes(item)) {
        errors.push(`deprecated-modules.md must mention: ${item}`)
      }
    }

    const roadmap = existsSync(join(ROOT, 'ROADMAP.md')) ? read('ROADMAP.md') : ''
    if (!roadmap.includes('WhatsApp Assistant') || !roadmap.includes('Assistant-01')) {
      errors.push('ROADMAP.md must reference WhatsApp Assistant and Assistant-01')
    }

    const readme = existsSync(join(ROOT, 'README.md')) ? read('README.md') : ''
    if (!readme.includes('WhatsApp Assistant')) {
      errors.push('README.md must reference WhatsApp Assistant')
    }

    return createResult(this.name, errors)
  },
}

export const Assistant01ReportsPlaceholderHarness: Harness = {
  name: 'Assistant01ReportsPlaceholderHarness',
  async run() {
    const errors: string[] = []
    const reportsSpec = join(EPIC, 'reports-module-spec.md')
    if (!existsSync(reportsSpec)) {
      errors.push('Missing reports-module-spec.md')
      return createResult(this.name, errors)
    }
    const content = read(reportsSpec)
    if (!content.includes('NÃO IMPLEMENTAR') && !content.includes('SPEC ONLY')) {
      errors.push('reports-module-spec must state no implementation in this phase')
    }
    if (!content.includes('DailyReport')) {
      errors.push('reports-module-spec must define DailyReport model')
    }
    return createResult(this.name, errors)
  },
}
