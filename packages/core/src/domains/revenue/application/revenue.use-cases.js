import { AlreadyDeletedError, NotFoundError } from '../../../domain/errors';
import { DomainEvents } from '../../../events/index';
import { generateId } from '../../../domain/utils';
import { Revenue } from '../domain/revenue.entity';
export class CreateRevenueUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const revenue = Revenue.create({
            id: generateId(),
            description: input.description,
            amount: input.amount,
            date: input.date,
            source: input.source,
        });
        const saved = await this.repository.save(revenue);
        await this.eventBus.publish({
            name: DomainEvents.RevenueCreated,
            payload: { revenueId: saved.id, amount: saved.amount, source: saved.source },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class UpdateRevenueUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const existing = await this.repository.findById(input.id);
        if (!existing)
            throw new NotFoundError('Revenue', input.id);
        const updated = existing.update(input);
        const saved = await this.repository.save(updated);
        await this.eventBus.publish({
            name: DomainEvents.RevenueUpdated,
            payload: { revenueId: saved.id, changes: input },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class SoftDeleteRevenueUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(id) {
        const existing = await this.repository.findById(id);
        if (!existing)
            throw new NotFoundError('Revenue', id);
        if (existing.isDeleted)
            throw new AlreadyDeletedError('Revenue');
        const deleted = existing.softDelete();
        const saved = await this.repository.save(deleted);
        await this.eventBus.publish({
            name: DomainEvents.RevenueSoftDeleted,
            payload: { revenueId: saved.id, deletedAt: saved.deletedAt },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class GetRevenueByIdUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id, includeDeleted = false) {
        const revenue = await this.repository.findById(id);
        if (!revenue)
            throw new NotFoundError('Revenue', id);
        if (revenue.isDeleted && !includeDeleted) {
            throw new NotFoundError('Revenue', id);
        }
        return revenue;
    }
}
export class ListRevenuesUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(filters = {}, pagination = { page: 1, limit: 10 }) {
        return this.repository.findMany(filters, pagination);
    }
}
//# sourceMappingURL=revenue.use-cases.js.map