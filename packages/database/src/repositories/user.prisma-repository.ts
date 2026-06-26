import type { PrismaClient } from '@prisma/client'
import { Email } from '@finance-ai/core/domain/value-objects/email'
import type { UserRepository } from '@finance-ai/core/domains/user'
import type { User } from '@finance-ai/core/domains/user'
import { UserMapper } from '../mappers/user.mapper'

export class UserPrismaRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user)
    const saved = await this.prisma.user.upsert({
      where: { id: user.id },
      create: data,
      update: data,
    })
    return UserMapper.toDomain(saved)
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } })
    return record ? UserMapper.toDomain(record) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = Email.create(email).value
    const record = await this.prisma.user.findUnique({ where: { email: normalized } })
    return record ? UserMapper.toDomain(record) : null
  }

  async findAll(): Promise<User[]> {
    const records = await this.prisma.user.findMany()
    return records.map(UserMapper.toDomain)
  }
}
