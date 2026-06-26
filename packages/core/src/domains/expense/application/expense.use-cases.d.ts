import { type EventBus, type PaginatedResult, type PaginationInput } from '../../../events/index';
import type { ExpenseSource } from '../../../domain/value-objects/enums';
import type { CategoryRepository } from '../../category/domain/category.repository';
import type { SupplierRepository } from '../../supplier/domain/supplier.repository';
import { Expense } from '../domain/expense.entity';
import type { ExpenseListFilters, ExpenseRepository } from '../domain/expense.repository';
export type CreateExpenseInput = {
    description: string;
    amount: number;
    categoryId: string;
    supplierId?: string | null;
    date: Date;
    source: ExpenseSource;
    confidence?: number;
};
export declare class CreateExpenseUseCase {
    private readonly expenseRepository;
    private readonly categoryRepository;
    private readonly supplierRepository;
    private readonly eventBus;
    constructor(expenseRepository: ExpenseRepository, categoryRepository: CategoryRepository, supplierRepository: SupplierRepository, eventBus: EventBus);
    execute(input: CreateExpenseInput): Promise<Expense>;
}
export type UpdateExpenseInput = {
    id: string;
    description?: string;
    amount?: number;
    categoryId?: string;
    supplierId?: string | null;
    date?: Date;
};
export declare class UpdateExpenseUseCase {
    private readonly expenseRepository;
    private readonly categoryRepository;
    private readonly eventBus;
    constructor(expenseRepository: ExpenseRepository, categoryRepository: CategoryRepository, eventBus: EventBus);
    execute(input: UpdateExpenseInput): Promise<Expense>;
}
export declare class SoftDeleteExpenseUseCase {
    private readonly expenseRepository;
    private readonly eventBus;
    constructor(expenseRepository: ExpenseRepository, eventBus: EventBus);
    execute(id: string): Promise<Expense>;
}
export declare class GetExpenseByIdUseCase {
    private readonly expenseRepository;
    constructor(expenseRepository: ExpenseRepository);
    execute(id: string, includeDeleted?: boolean): Promise<Expense>;
}
export declare class ListExpensesUseCase {
    private readonly expenseRepository;
    constructor(expenseRepository: ExpenseRepository);
    execute(filters?: ExpenseListFilters, pagination?: PaginationInput): Promise<PaginatedResult<Expense>>;
}
//# sourceMappingURL=expense.use-cases.d.ts.map