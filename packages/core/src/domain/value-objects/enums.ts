import { ValidationError } from '@finance-ai/shared/errors'

export const USER_ROLES = ['ADMIN', 'MANAGER', 'VIEWER'] as const
export type UserRole = (typeof USER_ROLES)[number]

export class UserRoleVO {
  readonly value: UserRole

  private constructor(value: UserRole) {
    this.value = value
  }

  static create(value: string): UserRoleVO {
    if (!USER_ROLES.includes(value as UserRole)) {
      throw new ValidationError(`Invalid role: ${value}`)
    }
    return new UserRoleVO(value as UserRole)
  }
}

export const CATEGORY_TYPES = ['EXPENSE', 'REVENUE'] as const
export type CategoryType = (typeof CATEGORY_TYPES)[number]

export class CategoryTypeVO {
  readonly value: CategoryType

  private constructor(value: CategoryType) {
    this.value = value
  }

  static create(value: string): CategoryTypeVO {
    if (!CATEGORY_TYPES.includes(value as CategoryType)) {
      throw new ValidationError(`Invalid category type: ${value}`)
    }
    return new CategoryTypeVO(value as CategoryType)
  }
}

export const EXPENSE_SOURCES = [
  'MANUAL',
  'WHATSAPP_TEXT',
  'WHATSAPP_IMAGE',
  'OCR',
  'IMPORT',
] as const
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number]

export class ExpenseSourceVO {
  readonly value: ExpenseSource

  private constructor(value: ExpenseSource) {
    this.value = value
  }

  static create(value: string): ExpenseSourceVO {
    if (!EXPENSE_SOURCES.includes(value as ExpenseSource)) {
      throw new ValidationError(`Invalid expense source: ${value}`)
    }
    return new ExpenseSourceVO(value as ExpenseSource)
  }
}

export type RevenueSource = ExpenseSource
