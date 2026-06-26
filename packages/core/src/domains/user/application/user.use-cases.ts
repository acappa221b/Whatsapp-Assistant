import { ForbiddenError, NotFoundError } from '../../../domain/errors'
import { DomainEvents, type EventBus } from '../../../events/index'
import { generateId } from '../../../domain/utils'
import type { UserRole } from '../../../domain/value-objects/enums'
import { User } from '../domain/user.entity'
import type { UserRepository } from '../domain/user.repository'
import { assertUniqueUserEmail } from '../infrastructure/user.repository.helpers'

export type CreateUserInput = {
  name: string
  email: string
  role?: UserRole
}

export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    await assertUniqueUserEmail(this.repository, input.email)
    const user = User.create({
      id: generateId(),
      name: input.name,
      email: input.email,
      role: input.role,
    })
    const saved = await this.repository.save(user)
    await this.eventBus.publish({
      name: DomainEvents.UserCreated,
      payload: { userId: saved.id, email: saved.email, role: saved.role },
      occurredAt: new Date(),
    })
    return saved
  }
}

export type UpdateUserInput = {
  id: string
  name?: string
  email?: string
  role?: UserRole
}

export class UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const existing = await this.repository.findById(input.id)
    if (!existing) throw new NotFoundError('User', input.id)
    if (input.email) await assertUniqueUserEmail(this.repository, input.email, existing.id)
    const updated = existing.update({
      name: input.name,
      email: input.email,
      role: input.role,
    })
    const saved = await this.repository.save(updated)
    await this.eventBus.publish({
      name: DomainEvents.UserUpdated,
      payload: { userId: saved.id, changes: { name: saved.name, email: saved.email, role: saved.role } },
      occurredAt: new Date(),
    })
    return saved
  }
}

export class GetUserByIdUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.repository.findById(id)
    if (!user) throw new NotFoundError('User', id)
    return user
  }
}

export class ListUsersUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(callerRole: UserRole): Promise<User[]> {
    if (callerRole !== 'ADMIN') {
      throw new ForbiddenError('Only ADMIN can list users')
    }
    return this.repository.findAll()
  }
}
