import type { CategoryType } from '../../../domain/value-objects/enums';
import type { Category } from './category.entity';
export type CategoryRepository = {
    save(category: Category): Promise<Category>;
    findById(id: string): Promise<Category | null>;
    findByNameAndType(name: string, type: CategoryType): Promise<Category | null>;
    findAllByType(type?: CategoryType): Promise<Category[]>;
};
//# sourceMappingURL=category.repository.d.ts.map