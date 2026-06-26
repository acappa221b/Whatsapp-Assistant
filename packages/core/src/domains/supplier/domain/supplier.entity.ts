import { ValidationError } from '@finance-ai/shared/errors'
import { normalizeName } from '../../../domain/utils'

export type SupplierProps = {
  id: string
  name: string
  document: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export class Supplier {
  readonly id: string
  readonly name: string
  readonly document: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null

  private constructor(props: SupplierProps) {
    this.id = props.id
    this.name = props.name
    this.document = props.document
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
    this.deletedAt = props.deletedAt
  }

  static create(input: {
    id: string
    name: string
    document?: string | null
    now?: Date
  }): Supplier {
    const name = Supplier.validateName(input.name)
    const now = input.now ?? new Date()
    return new Supplier({
      id: input.id,
      name,
      document: input.document ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }

  static reconstitute(props: SupplierProps): Supplier {
    return new Supplier(props)
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null
  }

  update(input: { name?: string; document?: string | null }): Supplier {
    if (this.isDeleted) {
      throw new ValidationError('Cannot update deleted supplier')
    }
    const name = input.name !== undefined ? Supplier.validateName(input.name) : this.name
    const document = input.document !== undefined ? input.document : this.document
    return new Supplier({
      id: this.id,
      name,
      document,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: this.deletedAt,
    })
  }

  softDelete(at: Date = new Date()): Supplier {
    if (this.isDeleted) {
      throw new ValidationError('Supplier is already deleted')
    }
    return new Supplier({
      ...this,
      updatedAt: at,
      deletedAt: at,
    })
  }

  static validateName(name: string): string {
    const normalized = normalizeName(name)
    if (normalized.length < 2) {
      throw new ValidationError('Supplier name must be at least 2 characters')
    }
    if (normalized.length > 200) {
      throw new ValidationError('Supplier name must be at most 200 characters')
    }
    return normalized
  }

  static namesEqual(a: string, b: string): boolean {
    return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase()
  }
}
