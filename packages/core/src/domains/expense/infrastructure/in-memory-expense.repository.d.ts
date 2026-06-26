import type { PaginatedResult, PaginationInput } from '../../../events/index';
import { Expense } from '../domain/expense.entity';
import type { ExpenseListFilters, ExpenseRepository } from '../domain/expense.repository';
export declare class InMemoryExpenseRepository implements ExpenseRepository {
    private store;
    save(expense: Expense): Promise<Expense>;
    findById(id: string): Promise<Expense | null>;
    findMany(filters: ExpenseListFilters, pagination: PaginationInput): Promise<PaginatedResult<Expense>>;
}
//# sourceMappingURL=in-memory-expense.repository.d.ts.map