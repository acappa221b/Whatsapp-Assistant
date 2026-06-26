import { Email } from '../../../domain/value-objects/email'
import { User } from '../domain/user.entity'
import type { UserRepository } from '../domain/user.repository'

export class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, User>()

  async save(user: User): Promise<User> {
    this.store.set(user.id, user)
    return user
  }

  async findById(id: string): Promise<User | null> {
    return this.store.get(id) ?? null
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = Email.create(email).value
    for (const user of this.store.values()) {
      if (user.email === normalized) return user
    }
    return null
  }

  async findAll(): Promise<User[]> {
    return [...this.store.values()]
  }
}
