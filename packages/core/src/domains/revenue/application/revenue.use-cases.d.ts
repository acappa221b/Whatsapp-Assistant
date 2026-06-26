import { type EventBus, type PaginatedResult, type PaginationInput } from '../../../events/index';
import type { ExpenseSource } from '../../../domain/value-objects/enums';
import { Revenue } from '../domain/revenue.entity';
import type { RevenueListFilters, RevenueRepository } from '../domain/revenue.repository';
export type CreateRevenueInput = {
    description: string;
    amount: number;
    date: Date;
    source: ExpenseSource;
};
export declare class CreateRevenueUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: RevenueRepository, eventBus: EventBus);
    execute(input: CreateRevenueInput): Promise<Revenue>;
}
export type UpdateRevenueInput = {
    id: string;
    description?: string;
    amount?: number;
    date?: Date;
};
export declare class UpdateRevenueUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: RevenueRepository, eventBus: EventBus);
    execute(input: UpdateRevenueInput): Promise<Revenue>;
}
export declare class SoftDeleteRevenueUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: RevenueRepository, eventBus: EventBus);
    execute(id: string): Promise<Revenue>;
}
export declare class GetRevenueByIdUseCase {
    private readonly repository;
    constructor(repository: RevenueRepository);
    execute(id: string, includeDeleted?: boolean): Promise<Revenue>;
}
export declare class ListRevenuesUseCase {
    private readonly repository;
    constructor(repository: RevenueRepository);
    execute(filters?: RevenueListFilters, pagination?: PaginationInput): Promise<PaginatedResult<Revenue>>;
}
//# sourceMappingURL=revenue.use-cases.d.ts.map