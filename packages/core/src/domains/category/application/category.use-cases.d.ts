import { type EventBus } from '../../../events/index';
import { Category } from '../domain/category.entity';
import type { CategoryRepository } from '../domain/category.repository';
import type { CategoryType } from '../../../domain/value-objects/enums';
export type CreateCategoryInput = {
    name: string;
    type: CategoryType;
};
export declare class CreateCategoryUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: CategoryRepository, eventBus: EventBus);
    execute(input: CreateCategoryInput): Promise<Category>;
}
export type UpdateCategoryInput = {
    id: string;
    name: string;
};
export declare class UpdateCategoryUseCase {
    private readonly repository;
    private readonly eventBus;
    constructor(repository: CategoryRepository, eventBus: EventBus);
    execute(input: UpdateCategoryInput): Promise<Category>;
}
export declare class GetCategoryByIdUseCase {
    private readonly repository;
    constructor(repository: CategoryRepository);
    execute(id: string): Promise<Category>;
}
export declare class ListCategoriesUseCase {
    private readonly repository;
    constructor(repository: CategoryRepository);
    execute(type?: CategoryType): Promise<Category[]>;
}
//# sourceMappingURL=category.use-cases.d.ts.map