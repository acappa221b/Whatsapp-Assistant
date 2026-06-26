export class InMemoryRevenueRepository {
    store = new Map();
    async save(revenue) {
        this.store.set(revenue.id, revenue);
        return revenue;
    }
    async findById(id) {
        return this.store.get(id) ?? null;
    }
    async findMany(filters, pagination) {
        let items = [...this.store.values()];
        if (!filters.includeDeleted) {
            items = items.filter((r) => !r.isDeleted);
        }
        const total = items.length;
        const start = (pagination.page - 1) * pagination.limit;
        const paged = items.slice(start, start + pagination.limit);
        return { items: paged, total, page: pagination.page, limit: pagination.limit };
    }
}
//# sourceMappingURL=in-memory-revenue.repository.js.map