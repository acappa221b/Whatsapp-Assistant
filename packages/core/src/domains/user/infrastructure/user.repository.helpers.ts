import { ConflictError } from '../../../domain/errors'
import type { UserRepository } from '../domain/user.repository'

export async function assertUniqueUserEmail(
  repository: UserRepository,
  email: string,
  excludeId?: string,
): Promise<void> {
  const existing = await repository.findByEmail(email)
  if (existing && existing.id !== excludeId) {
    throw new ConflictError(`Email "${email}" already exists`)
  }
}
