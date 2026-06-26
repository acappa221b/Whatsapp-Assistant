import { ForbiddenError, NotFoundError } from '../../../domain/errors';
import { DomainEvents } from '../../../events/index';
import { generateId } from '../../../domain/utils';
import { User } from '../domain/user.entity';
import { assertUniqueUserEmail } from '../infrastructure/user.repository.helpers';
export class CreateUserUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        await assertUniqueUserEmail(this.repository, input.email);
        const user = User.create({
            id: generateId(),
            name: input.name,
            email: input.email,
            role: input.role,
        });
        const saved = await this.repository.save(user);
        await this.eventBus.publish({
            name: DomainEvents.UserCreated,
            payload: { userId: saved.id, email: saved.email, role: saved.role },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class UpdateUserUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const existing = await this.repository.findById(input.id);
        if (!existing)
            throw new NotFoundError('User', input.id);
        if (input.email)
            await assertUniqueUserEmail(this.repository, input.email, existing.id);
        const updated = existing.update({
            name: input.name,
            email: input.email,
            role: input.role,
        });
        const saved = await this.repository.save(updated);
        await this.eventBus.publish({
            name: DomainEvents.UserUpdated,
            payload: { userId: saved.id, changes: { name: saved.name, email: saved.email, role: saved.role } },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class GetUserByIdUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id) {
        const user = await this.repository.findById(id);
        if (!user)
            throw new NotFoundError('User', id);
        return user;
    }
}
export class ListUsersUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(callerRole) {
        if (callerRole !== 'ADMIN') {
            throw new ForbiddenError('Only ADMIN can list users');
        }
        return this.repository.findAll();
    }
}
//# sourceMappingURL=user.use-cases.js.map