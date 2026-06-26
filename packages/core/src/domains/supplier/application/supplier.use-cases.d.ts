import { type EventBus } from '../../../events/index';
import { Supplier } from '../domain/supplier.entity';
import type { SupplierRepository } from '../domain/supplier.repository';
export type CreateSupplierInput = {
    name: string;
    document?: string | null;
};
export declare class CreateSupplierUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: SupplierRepository, eventBus: EventBus);
    execute(input: CreateSupplierInput): Promise<Supplier>;
}
export type UpdateSupplierInput = {
    id: string;
    name?: string;
    document?: string | null;
};
export declare class UpdateSupplierUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: SupplierRepository, eventBus: EventBus);
    execute(input: UpdateSupplierInput): Promise<Supplier>;
}
export declare class SoftDeleteSupplierUseCase {
    private readonly repository;
    constructor(repository: SupplierRepository);
    execute(id: string): Promise<Supplier>;
}
export declare class GetSupplierByIdUseCase {
    private readonly repository;
    constructor(repository: SupplierRepository);
    execute(id: string): Promise<Supplier>;
}
export declare class ListSuppliersUseCase {
    private readonly repository;
    constructor(repository: SupplierRepository);
    execute(): Promise<Supplier[]>;
}
//# sourceMappingURL=supplier.use-cases.d.ts.map