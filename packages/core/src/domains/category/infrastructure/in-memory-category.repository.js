import { Category } from '../domain/category.entity';
export class InMemoryCategoryRepository {
    store = new Map();
    async save(category) {
        this.store.set(category.id, category);
        return category;
    }
    async findById(id) {
        return this.store.get(id) ?? null;
    }
    async findByNameAndType(name, type) {
        for (const category of this.store.values()) {
            if (category.type === type && Category.namesEqual(category.name, name)) {
                return category;
            }
        }
        return null;
    }
    async findAllByType(type) {
        const all = [...this.store.values()];
        return type ? all.filter((c) => c.type === type) : all;
    }
}
//# sourceMappingURL=in-memory-category.repository.js.map