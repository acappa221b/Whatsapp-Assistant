import type { PaginatedResult, PaginationInput } from '../../../events/index';
import { Revenue } from '../domain/revenue.entity';
import type { RevenueListFilters, RevenueRepository } from '../domain/revenue.repository';
export declare class InMemoryRevenueRepository implements RevenueRepository {
    private store;
    save(revenue: Revenue): Promise<Revenue>;
    findById(id: string): Promise<Revenue | null>;
    findMany(filters: RevenueListFilters, pagination: PaginationInput): Promise<PaginatedResult<Revenue>>;
}
//# sourceMappingURL=in-memory-revenue.repository.d.ts.map