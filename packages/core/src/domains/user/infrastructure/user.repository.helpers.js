import { ConflictError } from '../../../domain/errors';
export async function assertUniqueUserEmail(repository, email, excludeId) {
    const existing = await repository.findByEmail(email);
    if (existing && existing.id !== excludeId) {
        throw new ConflictError(`Email "${email}" already exists`);
    }
}
//# sourceMappingURL=user.repository.helpers.js.map