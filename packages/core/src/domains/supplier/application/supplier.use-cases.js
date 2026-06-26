import { AlreadyDeletedError, NotFoundError } from '../../../domain/errors';
import { DomainEvents } from '../../../events/index';
import { generateId } from '../../../domain/utils';
import { Supplier } from '../domain/supplier.entity';
import { assertUniqueSupplierName } from '../infrastructure/in-memory-supplier.repository';
export class CreateSupplierUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        await assertUniqueSupplierName(this.repository, input.name);
        const supplier = Supplier.create({
            id: generateId(),
            name: input.name,
            document: input.document,
        });
        const saved = await this.repository.save(supplier);
        await this.eventBus.publish({
            name: DomainEvents.SupplierCreated,
            payload: { supplierId: saved.id, name: saved.name },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class UpdateSupplierUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const existing = await this.repository.findById(input.id);
        if (!existing)
            throw new NotFoundError('Supplier', input.id);
        if (input.name)
            await assertUniqueSupplierName(this.repository, input.name, existing.id);
        const updated = existing.update({ name: input.name, document: input.document });
        const saved = await this.repository.save(updated);
        await this.eventBus.publish({
            name: DomainEvents.SupplierUpdated,
            payload: { supplierId: saved.id, changes: { name: saved.name, document: saved.document } },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class SoftDeleteSupplierUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id) {
        const existing = await this.repository.findById(id);
        if (!existing)
            throw new NotFoundError('Supplier', id);
        if (existing.isDeleted)
            throw new AlreadyDeletedError('Supplier');
        const deleted = existing.softDelete();
        return this.repository.save(deleted);
    }
}
export class GetSupplierByIdUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id) {
        const supplier = await this.repository.findById(id);
        if (!supplier)
            throw new NotFoundError('Supplier', id);
        return supplier;
    }
}
export class ListSuppliersUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute() {
        return this.repository.findAllActive();
    }
}
//# sourceMappingURL=supplier.use-cases.js.map