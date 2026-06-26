import { ConflictError } from '../../../domain/errors';
import { Supplier } from '../domain/supplier.entity';
export class InMemorySupplierRepository {
    store = new Map();
    async save(supplier) {
        this.store.set(supplier.id, supplier);
        return supplier;
    }
    async findById(id) {
        return this.store.get(id) ?? null;
    }
    async findByName(name) {
        for (const supplier of this.store.values()) {
            if (!supplier.isDeleted && Supplier.namesEqual(supplier.name, name)) {
                return supplier;
            }
        }
        return null;
    }
    async findAllActive() {
        return [...this.store.values()].filter((s) => !s.isDeleted);
    }
}
export async function assertUniqueSupplierName(repository, name, excludeId) {
    const existing = await repository.findByName(name);
    if (existing && existing.id !== excludeId) {
        throw new ConflictError(`Supplier "${name}" already exists`);
    }
}
//# sourceMappingURL=in-memory-supplier.repository.js.map