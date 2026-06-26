import { Supplier } from '../domain/supplier.entity';
import type { SupplierRepository } from '../domain/supplier.repository';
export declare class InMemorySupplierRepository implements SupplierRepository {
    private store;
    save(supplier: Supplier): Promise<Supplier>;
    findById(id: string): Promise<Supplier | null>;
    findByName(name: string): Promise<Supplier | null>;
    findAllActive(): Promise<Supplier[]>;
}
export declare function assertUniqueSupplierName(repository: SupplierRepository, name: string, excludeId?: string): Promise<void>;
//# sourceMappingURL=in-memory-supplier.repository.d.ts.map