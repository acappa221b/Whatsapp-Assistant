import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const EPIC08 = join(ROOT, 'specs/epic-08')

const REQUIRED_ENTITY_SECTIONS = [
  '## Objetivo',
  '## Definicao',
  '## Campos',
  '## Regras de Negocio',
  '## Invariantes',
  '## Casos de Uso',
  '## Eventos Emitidos',
  '## Dependencias',
  '## Criterios de Aceite',
  '## Casos de Borda',
  '## Estrategia de Testes',
]

export function validateEpic08EntitySpec(
  entity: string,
  extraChecks?: (content: string, errors: string[]) => void,
): string[] {
  const errors: string[] = []
  const readmePath = join(EPIC08, entity, 'README.md')

  if (!existsSync(readmePath)) {
    errors.push(`Missing specs/epic-08/${entity}/README.md`)
    return errors
  }

  const content = readFileSync(readmePath, 'utf-8')
  for (const section of REQUIRED_ENTITY_SECTIONS) {
    if (!content.includes(section)) {
      errors.push(`${entity}: missing section "${section.replace('## ', '')}"`)
    }
  }

  if (!content.includes('Given') || !content.includes('When') || !content.includes('Then')) {
    errors.push(`${entity}: acceptance criteria must use Given/When/Then`)
  }

  extraChecks?.(content, errors)
  return errors
}

export function validateEpic08SharedArtifacts(): string[] {
  const errors: string[] = []
  const shared = ['README.md', 'test-matrix.md', 'events-catalog.md', 'adr-impact.md']

  for (const file of shared) {
    if (!existsSync(join(EPIC08, file))) {
      errors.push(`Missing specs/epic-08/${file}`)
    }
  }

  const matrixPath = join(EPIC08, 'test-matrix.md')
  if (existsSync(matrixPath)) {
    const matrix = readFileSync(matrixPath, 'utf-8')
    for (const id of ['FC-001', 'CI-001', 'AQ-001', 'AI-001', 'WF-001', 'AQ-017', 'WF-018']) {
      if (!matrix.includes(id)) {
        errors.push(`test-matrix.md missing case: ${id}`)
      }
    }
    const totalMatch = matrix.match(/\*\*Total de casos:\*\*\s*(\d+)/)
    const total = totalMatch ? Number(totalMatch[1]) : 0
    if (total < 60) {
      errors.push('test-matrix.md must document at least 60 test cases')
    }
  }

  const eventsPath = join(EPIC08, 'events-catalog.md')
  if (existsSync(eventsPath)) {
    const events = readFileSync(eventsPath, 'utf-8')
    for (const event of [
      'CandidateCreated',
      'CandidateUpdated',
      'CandidateApproved',
      'CandidateRejected',
      'CandidateItemApproved',
      'CandidateItemRejected',
      'CandidateItemEdited',
      'CandidateBulkApproved',
      'CandidateBulkRejected',
    ]) {
      if (!events.includes(event)) {
        errors.push(`events-catalog.md missing event: ${event}`)
      }
    }
  }

  const adrPath = join(EPIC08, 'adr-impact.md')
  if (existsSync(adrPath)) {
    const adr = readFileSync(adrPath, 'utf-8')
    for (const ref of ['ADR-001', 'ADR-002', 'ADR-003', 'ADR-004', 'ADR-006', 'ADR-007']) {
      if (!adr.includes(ref)) {
        errors.push(`adr-impact.md missing reference: ${ref}`)
      }
    }
  }

  const readmePath = join(EPIC08, 'README.md')
  if (existsSync(readmePath)) {
    const readme = readFileSync(readmePath, 'utf-8')
    for (const needle of [
      'Financial Candidate',
      'Approval Queue',
      'CandidateItem',
      '/dashboard/approvals',
      'Approve All',
      'Reject All',
      'Approve Selected',
      'Reject Selected',
      'Adjustment',
      'Excel permanece',
    ]) {
      if (!readme.includes(needle)) {
        errors.push(`README.md missing epic concept: ${needle}`)
      }
    }
  }

  return errors
}

export function createEpic08Harness(
  name: string,
  entity: string,
  extraChecks?: (content: string, errors: string[]) => void,
): Harness {
  return {
    name,
    async run() {
      const errors = [
        ...validateEpic08EntitySpec(entity, extraChecks),
        ...validateEpic08SharedArtifacts(),
      ]
      return createResult(name, errors)
    },
  }
}
