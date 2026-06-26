import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from './types'
import { createResult } from './types'

const ROOT = join(import.meta.dirname, '..')

export const AIHarness: Harness = {
  name: 'AIHarness',
  async run() {
    const errors: string[] = []
    const schemaPath = join(ROOT, 'packages/ai/src/schemas/expense-extraction.schema.ts')

    if (!existsSync(schemaPath)) {
      errors.push('Missing ExpenseExtractionSchema')
      return createResult(this.name, errors)
    }

    const content = readFileSync(schemaPath, 'utf-8')
    for (const field of ['description', 'amount', 'category', 'confidence']) {
      if (!content.includes(field)) {
        errors.push(`ExpenseExtractionSchema missing field: ${field}`)
      }
    }

    return createResult(this.name, errors)
  },
}

export const WhatsAppHarness: Harness = {
  name: 'WhatsAppHarness',
  async run() {
    const errors: string[] = []
    const providerPath = join(ROOT, 'packages/whatsapp/src/index.ts')

    if (!existsSync(providerPath)) {
      errors.push('Missing WhatsappProvider interface')
      return createResult(this.name, errors)
    }

    const content = readFileSync(providerPath, 'utf-8')
    for (const method of ['connect', 'disconnect', 'sendMessage', 'onMessage']) {
      if (!content.includes(method)) {
        errors.push(`WhatsappProvider missing method: ${method}`)
      }
    }

    return createResult(this.name, errors)
  },
}

export const ExcelHarness: Harness = {
  name: 'ExcelHarness',
  async run() {
    const errors: string[] = []
    const excelPath = join(ROOT, 'packages/excel/src/index.ts')

    if (!existsSync(excelPath)) {
      errors.push('Missing excel package')
      return createResult(this.name, errors)
    }

    const content = readFileSync(excelPath, 'utf-8')
    for (const fn of ['generateMonthlyWorkbook', 'generateYearWorkbook']) {
      if (!content.includes(fn)) {
        errors.push(`Missing excel function: ${fn}`)
      }
    }

    return createResult(this.name, errors)
  },
}

export const SecurityHarness: Harness = {
  name: 'SecurityHarness',
  async run() {
    const errors: string[] = []
    const gitignorePath = join(ROOT, '.gitignore')

    if (!existsSync(join(ROOT, '.env.example'))) {
      errors.push('Missing .env.example')
    }
    if (!existsSync(gitignorePath)) {
      errors.push('Missing .gitignore')
    } else {
      const gitignore = readFileSync(gitignorePath, 'utf-8')
      if (!gitignore.includes('.env')) {
        errors.push('.gitignore must ignore .env files')
      }
    }
    return createResult(this.name, errors)
  },
}
