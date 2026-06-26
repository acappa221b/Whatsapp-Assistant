import type { CategoryType } from '../../../domain/value-objects/enums';
import { Category } from '../domain/category.entity';
import type { CategoryRepository } from '../domain/category.repository';
export declare class InMemoryCategoryRepository implements CategoryRepository {
    private store;
    save(category: Category): Promise<Category>;
    findById(id: string): Promise<Category | null>;
    findByNameAndType(name: string, type: CategoryType): Promise<Category | null>;
    findAllByType(type?: CategoryType): Promise<Category[]>;
}
//# sourceMappingURL=in-memory-category.repository.d.ts.map