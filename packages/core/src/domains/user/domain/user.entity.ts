import { ValidationError } from '@finance-ai/shared/errors'
import { Email } from '../../../domain/value-objects/email'
import { UserRole, UserRoleVO } from '../../../domain/value-objects/enums'
import { normalizeName } from '../../../domain/utils'

export type UserProps = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export class User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: UserRole
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: UserProps) {
    this.id = props.id
    this.name = props.name
    this.email = props.email
    this.role = props.role
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(input: {
    id: string
    name: string
    email: string
    role?: UserRole
    now?: Date
  }): User {
    const name = User.validateName(input.name)
    const email = Email.create(input.email).value
    const role = UserRoleVO.create(input.role ?? 'VIEWER').value
    const now = input.now ?? new Date()
    return new User({ id: input.id, name, email, role, createdAt: now, updatedAt: now })
  }

  static reconstitute(props: UserProps): User {
    return new User(props)
  }

  update(input: { name?: string; email?: string; role?: UserRole }): User {
    const name = input.name !== undefined ? User.validateName(input.name) : this.name
    const email = input.email !== undefined ? Email.create(input.email).value : this.email
    const role = input.role !== undefined ? UserRoleVO.create(input.role).value : this.role
    return new User({
      id: this.id,
      name,
      email,
      role,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  static validateName(name: string): string {
    const normalized = normalizeName(name)
    if (normalized.length < 2) {
      throw new ValidationError('User name must be at least 2 characters')
    }
    if (normalized.length > 150) {
      throw new ValidationError('User name must be at most 150 characters')
    }
    return normalized
  }
}
