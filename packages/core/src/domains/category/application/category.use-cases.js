import { ConflictError, NotFoundError } from '../../../domain/errors';
import { DomainEvents } from '../../../events/index';
import { generateId } from '../../../domain/utils';
import { Category } from '../domain/category.entity';
export class CreateCategoryUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const existing = await this.repository.findByNameAndType(input.name, input.type);
        if (existing) {
            throw new ConflictError(`Category "${input.name}" already exists for type ${input.type}`);
        }
        const category = Category.create({ id: generateId(), name: input.name, type: input.type });
        const saved = await this.repository.save(category);
        await this.eventBus.publish({
            name: DomainEvents.CategoryCreated,
            payload: { categoryId: saved.id, name: saved.name, type: saved.type },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class UpdateCategoryUseCase {
    repository;
    eventBus;
    constructor(repository, eventBus) {
        this.repository = repository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const existing = await this.repository.findById(input.id);
        if (!existing)
            throw new NotFoundError('Category', input.id);
        const duplicate = await this.repository.findByNameAndType(input.name, existing.type);
        if (duplicate && duplicate.id !== existing.id) {
            throw new ConflictError(`Category "${input.name}" already exists for type ${existing.type}`);
        }
        const updated = existing.updateName(input.name);
        const saved = await this.repository.save(updated);
        await this.eventBus.publish({
            name: DomainEvents.CategoryUpdated,
            payload: { categoryId: saved.id, changes: { name: saved.name } },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class GetCategoryByIdUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(id) {
        const category = await this.repository.findById(id);
        if (!category)
            throw new NotFoundError('Category', id);
        return category;
    }
}
export class ListCategoriesUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(type) {
        return this.repository.findAllByType(type);
    }
}
//# sourceMappingURL=category.use-cases.js.map