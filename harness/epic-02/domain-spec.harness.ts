import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createDomainHarness } from './spec-validation'

const EPIC02 = join(import.meta.dirname, '../../specs/epic-02')

export const ExpenseDomainHarness = createDomainHarness(
  'ExpenseDomainHarness',
  'expense',
  (content, errors) => {
    for (const field of ['deletedAt', 'confidence', 'categoryId', 'supplierId', 'source']) {
      if (!content.includes(field)) {
        errors.push(`expense: missing field documentation: ${field}`)
      }
    }
    for (const uc of ['CreateExpense', 'UpdateExpense', 'SoftDeleteExpense', 'GetExpenseById', 'ListExpenses']) {
      if (!content.includes(uc)) {
        errors.push(`expense: missing use case: ${uc}`)
      }
    }
    for (const ev of ['ExpenseCreated', 'ExpenseUpdated', 'ExpenseSoftDeleted']) {
      if (!content.includes(ev)) {
        errors.push(`expense: missing event: ${ev}`)
      }
    }
    const diagramsPath = join(EPIC02, 'expense/sequence-diagrams.md')
    const diagrams = readFileSync(diagramsPath, 'utf-8')
    for (const diagram of ['CreateExpense', 'UpdateExpense', 'SoftDeleteExpense', 'ListExpenses']) {
      if (!diagrams.includes(diagram)) {
        errors.push(`expense: missing diagram: ${diagram}`)
      }
    }
  },
)

export const RevenueDomainHarness = createDomainHarness('RevenueDomainHarness', 'revenue', (content, errors) => {
  for (const uc of ['CreateRevenue', 'UpdateRevenue', 'SoftDeleteRevenue', 'GetRevenueById', 'ListRevenues']) {
    if (!content.includes(uc)) errors.push(`revenue: missing use case: ${uc}`)
  }
  for (const ev of ['RevenueCreated', 'RevenueUpdated', 'RevenueSoftDeleted']) {
    if (!content.includes(ev)) errors.push(`revenue: missing event: ${ev}`)
  }
  if (!content.includes('deletedAt')) errors.push('revenue: missing soft delete (ADR-004)')
})

export const CategoryDomainHarness = createDomainHarness('CategoryDomainHarness', 'category', (content, errors) => {
  if (!content.includes('EXPENSE') || !content.includes('REVENUE')) {
    errors.push('category: missing CategoryType enum')
  }
  if (!content.includes('Unicidade')) {
    errors.push('category: missing uniqueness rules')
  }
})

export const SupplierDomainHarness = createDomainHarness('SupplierDomainHarness', 'supplier', (content, errors) => {
  if (!content.includes('CPF') || !content.includes('CNPJ')) {
    errors.push('supplier: missing CPF/CNPJ future validation docs')
  }
  if (!content.includes('deletedAt')) errors.push('supplier: missing soft delete')
})

export const UserDomainHarness = createDomainHarness('UserDomainHarness', 'user', (content, errors) => {
  for (const role of ['ADMIN', 'MANAGER', 'VIEWER']) {
    if (!content.includes(role)) errors.push(`user: missing role: ${role}`)
  }
  if (!content.includes('Permissões')) {
    errors.push('user: missing permissions matrix')
  }
})
