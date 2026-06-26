import type { PaginatedResult, PaginationInput } from '../../../events/index';
import type { Revenue } from './revenue.entity';
export type RevenueListFilters = {
    includeDeleted?: boolean;
};
export type RevenueRepository = {
    save(revenue: Revenue): Promise<Revenue>;
    findById(id: string): Promise<Revenue | null>;
    findMany(filters: RevenueListFilters, pagination: PaginationInput): Promise<PaginatedResult<Revenue>>;
};
//# sourceMappingURL=revenue.repository.d.ts.map