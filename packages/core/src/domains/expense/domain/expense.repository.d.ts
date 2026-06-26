import type { PaginatedResult, PaginationInput } from '../../../events/index';
import type { Expense } from './expense.entity';
export type ExpenseListFilters = {
    categoryId?: string;
    includeDeleted?: boolean;
};
export type ExpenseRepository = {
    save(expense: Expense): Promise<Expense>;
    findById(id: string): Promise<Expense | null>;
    findMany(filters: ExpenseListFilters, pagination: PaginationInput): Promise<PaginatedResult<Expense>>;
};
//# sourceMappingURL=expense.repository.d.ts.map