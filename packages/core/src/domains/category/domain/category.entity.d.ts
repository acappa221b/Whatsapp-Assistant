import { CategoryType } from '../../../domain/value-objects/enums';
export type CategoryProps = {
    id: string;
    name: string;
    type: CategoryType;
    createdAt: Date;
    updatedAt: Date;
};
export declare class Category {
    readonly id: string;
    readonly name: string;
    readonly type: CategoryType;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    private constructor();
    static create(input: {
        id: string;
        name: string;
        type: CategoryType;
        now?: Date;
    }): Category;
    static reconstitute(props: CategoryProps): Category;
    updateName(name: string): Category;
    static validateAndNormalizeName(name: string): string;
    static namesEqual(a: string, b: string): boolean;
}
//# sourceMappingURL=category.entity.d.ts.map