import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')
const EPIC02 = join(ROOT, 'specs/epic-02')

const REQUIRED_SECTIONS = [
  '## Objetivo',
  '## Definição',
  '## Campos',
  '## Regras de Negócio',
  '## Invariantes',
  '## Casos de Uso',
  '## Eventos Emitidos',
  '## Dependências',
  '## Critérios de Aceite',
  '## Casos de Borda',
  '## Estratégia de Testes',
]

export function validateEntitySpec(entity: string, extraChecks?: (content: string, errors: string[]) => void): string[] {
  const errors: string[] = []
  const readmePath = join(EPIC02, entity, 'README.md')

  if (!existsSync(readmePath)) {
    errors.push(`Missing specs/epic-02/${entity}/README.md`)
    return errors
  }

  const content = readFileSync(readmePath, 'utf-8')

  for (const section of REQUIRED_SECTIONS) {
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

export function validateEpic02SharedArtifacts(): string[] {
  const errors: string[] = []
  const shared = [
    'test-matrix.md',
    'events-catalog.md',
    'adr-impact.md',
  ]

  for (const file of shared) {
    if (!existsSync(join(EPIC02, file))) {
      errors.push(`Missing specs/epic-02/${file}`)
    }
  }

  const matrix = readFileSync(join(EPIC02, 'test-matrix.md'), 'utf-8')
  if (!matrix.includes('EXP-001') || !matrix.includes('USR-')) {
    errors.push('test-matrix.md incomplete')
  }

  const events = readFileSync(join(EPIC02, 'events-catalog.md'), 'utf-8')
  for (const event of ['ExpenseCreated', 'RevenueSoftDeleted', 'CategoryCreated', 'SupplierCreated', 'UserCreated']) {
    if (!events.includes(event)) {
      errors.push(`events-catalog.md missing event: ${event}`)
    }
  }

  const adr = readFileSync(join(EPIC02, 'adr-impact.md'), 'utf-8')
  for (const ref of ['ADR-001', 'ADR-002', 'ADR-003', 'ADR-004']) {
    if (!adr.includes(ref)) {
      errors.push(`adr-impact.md missing reference: ${ref}`)
    }
  }

  return errors
}

export function createDomainHarness(name: string, entity: string, extraChecks?: (content: string, errors: string[]) => void): Harness {
  return {
    name,
    async run() {
      const errors = [
        ...validateEntitySpec(entity, extraChecks),
        ...validateEpic02SharedArtifacts(),
      ]
      return createResult(name, errors)
    },
  }
}
