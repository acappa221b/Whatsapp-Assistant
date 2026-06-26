import { ValidationError } from '@finance-ai/shared/errors'
import { ExpenseSource, ExpenseSourceVO } from '../../../domain/value-objects/enums'
import { Money } from '../../../domain/value-objects/money'
import { validateFutureDate } from '../../../domain/utils'

export type RevenueProps = {
  id: string
  description: string
  amount: number
  date: Date
  source: ExpenseSource
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Revenue {
  readonly id: string
  readonly description: string
  readonly amount: number
  readonly date: Date
  readonly source: ExpenseSource
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null

  private constructor(props: RevenueProps) {
    this.id = props.id
    this.description = props.description
    this.amount = props.amount
    this.date = props.date
    this.source = props.source
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt
  }

  static create(input: {
    id: string
    description: string
    amount: number
    date: Date
    source: ExpenseSource
    now?: Date
  }): Revenue {
    const description = Revenue.validateDescription(input.description)
    const amount = Money.create(input.amount).amount
    ExpenseSourceVO.create(input.source)
    validateFutureDate(input.date)
    const now = input.now ?? new Date()
    return new Revenue({
      id: input.id,
      description,
      amount,
      date: input.date,
      source: input.source,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  static reconstitute(props: RevenueProps): Revenue {
    return new Revenue(props)
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null
  }

  update(input: { description?: string; amount?: number; date?: Date }): Revenue {
    if (this.isDeleted) {
      throw new ValidationError('Cannot update deleted revenue')
    }
    const description =
      input.description !== undefined ? Revenue.validateDescription(input.description) : this.description
    const amount = input.amount !== undefined ? Money.create(input.amount).amount : this.amount
    const date = input.date ?? this.date
    if (input.date) validateFutureDate(date)
    return new Revenue({
      id: this.id,
      description,
      amount,
      date,
      source: this.source,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    })
  }

  softDelete(at: Date = new Date()): Revenue {
    if (this.isDeleted) {
      throw new ValidationError('Revenue is already deleted')
    }
    return new Revenue({
      ...this,
      updatedAt: at,
      deletedAt: at,
    })
  }

  static validateDescription(description: string): string {
    const trimmed = description.trim()
    if (trimmed.length < 1) {
      throw new ValidationError('Description is required')
    }
    if (trimmed.length > 500) {
      throw new ValidationError('Description must be at most 500 characters')
    }
    return trimmed
  }
}
