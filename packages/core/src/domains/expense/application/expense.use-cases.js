import { ValidationError } from '@finance-ai/shared/errors';
import { AlreadyDeletedError, NotFoundError } from '../../../domain/errors';
import { DomainEvents } from '../../../events/index';
import { generateId } from '../../../domain/utils';
import { Expense } from '../domain/expense.entity';
export class CreateExpenseUseCase {
    expenseRepository;
    categoryRepository;
    supplierRepository;
    eventBus;
    constructor(expenseRepository, categoryRepository, supplierRepository, eventBus) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const category = await this.categoryRepository.findById(input.categoryId);
        if (!category)
            throw new NotFoundError('Category', input.categoryId);
        if (category.type !== 'EXPENSE') {
            throw new ValidationError('Category must be of type EXPENSE');
        }
        if (input.supplierId) {
            const supplier = await this.supplierRepository.findById(input.supplierId);
            if (!supplier)
                throw new NotFoundError('Supplier', input.supplierId);
            if (supplier.isDeleted) {
                throw new ValidationError('Supplier is deleted');
            }
        }
        const expense = Expense.create({
            id: generateId(),
            description: input.description,
            amount: input.amount,
            categoryId: input.categoryId,
            supplierId: input.supplierId,
            date: input.date,
            source: input.source,
            confidence: input.confidence,
        });
        const saved = await this.expenseRepository.save(expense);
        await this.eventBus.publish({
            name: DomainEvents.ExpenseCreated,
            payload: {
                expenseId: saved.id,
                amount: saved.amount,
                categoryId: saved.categoryId,
                source: saved.source,
                confidence: saved.confidence,
            },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class UpdateExpenseUseCase {
    expenseRepository;
    categoryRepository;
    eventBus;
    constructor(expenseRepository, categoryRepository, eventBus) {
        this.expenseRepository = expenseRepository;
        this.categoryRepository = categoryRepository;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const existing = await this.expenseRepository.findById(input.id);
        if (!existing)
            throw new NotFoundError('Expense', input.id);
        if (input.categoryId) {
            const category = await this.categoryRepository.findById(input.categoryId);
            if (!category)
                throw new NotFoundError('Category', input.categoryId);
            if (category.type !== 'EXPENSE') {
                throw new ValidationError('Category must be of type EXPENSE');
            }
        }
        const updated = existing.update(input);
        const saved = await this.expenseRepository.save(updated);
        await this.eventBus.publish({
            name: DomainEvents.ExpenseUpdated,
            payload: { expenseId: saved.id, changes: input },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class SoftDeleteExpenseUseCase {
    expenseRepository;
    eventBus;
    constructor(expenseRepository, eventBus) {
        this.expenseRepository = expenseRepository;
        this.eventBus = eventBus;
    }
    async execute(id) {
        const existing = await this.expenseRepository.findById(id);
        if (!existing)
            throw new NotFoundError('Expense', id);
        if (existing.isDeleted)
            throw new AlreadyDeletedError('Expense');
        const deleted = existing.softDelete();
        const saved = await this.expenseRepository.save(deleted);
        await this.eventBus.publish({
            name: DomainEvents.ExpenseSoftDeleted,
            payload: { expenseId: saved.id, deletedAt: saved.deletedAt },
            occurredAt: new Date(),
        });
        return saved;
    }
}
export class GetExpenseByIdUseCase {
    expenseRepository;
    constructor(expenseRepository) {
        this.expenseRepository = expenseRepository;
    }
    async execute(id, includeDeleted = false) {
        const expense = await this.expenseRepository.findById(id);
        if (!expense)
            throw new NotFoundError('Expense', id);
        if (expense.isDeleted && !includeDeleted) {
            throw new NotFoundError('Expense', id);
        }
        return expense;
    }
}
export class ListExpensesUseCase {
    expenseRepository;
    constructor(expenseRepository) {
        this.expenseRepository = expenseRepository;
    }
    async execute(filters = {}, pagination = { page: 1, limit: 10 }) {
        return this.expenseRepository.findMany(filters, pagination);
    }
}
//# sourceMappingURL=expense.use-cases.js.map