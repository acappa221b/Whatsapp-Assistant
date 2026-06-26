export class InMemoryExpenseRepository {
    store = new Map();
    async save(expense) {
        this.store.set(expense.id, expense);
        return expense;
    }
    async findById(id) {
        return this.store.get(id) ?? null;
    }
    async findMany(filters, pagination) {
        let items = [...this.store.values()];
        if (!filters.includeDeleted) {
            items = items.filter((e) => !e.isDeleted);
        }
        if (filters.categoryId) {
            items = items.filter((e) => e.categoryId === filters.categoryId);
        }
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const total = items.length;
        const start = (pagination.page - 1) * pagination.limit;
        const paged = items.slice(start, start + pagination.limit);
        return { items: paged, total, page: pagination.page, limit: pagination.limit };
    }
}
//# sourceMappingURL=in-memory-expense.repository.js.map