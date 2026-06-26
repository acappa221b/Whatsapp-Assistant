import type { User as PrismaUser } from '@prisma/client'
import { User } from '@finance-ai/core/domains/user'
import type { UserRole } from '@finance-ai/core/domain/value-objects/enums'

export type UserPersistence = {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export const UserMapper = {
  toDomain(record: PrismaUser): User {
    return User.reconstitute({
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role as UserRole,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  },

  toPersistence(user: User): UserPersistence {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  },
}
