import { ExpenseSource } from '../../../domain/value-objects/enums';
export type ExpenseProps = {
    id: string;
    description: string;
    amount: number;
    categoryId: string;
    supplierId: string | null;
    date: Date;
    source: ExpenseSource;
    confidence: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};
export declare class Expense {
    readonly id: string;
    readonly description: string;
    readonly amount: number;
    readonly categoryId: string;
    readonly supplierId: string | null;
    readonly date: Date;
    readonly source: ExpenseSource;
    readonly confidence: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    private constructor();
    static create(input: {
        id: string;
        description: string;
        amount: number;
        categoryId: string;
        supplierId?: string | null;
        date: Date;
        source: ExpenseSource;
        confidence?: number;
        now?: Date;
    }): Expense;
    static reconstitute(props: ExpenseProps): Expense;
    get isDeleted(): boolean;
    update(input: {
        description?: string;
        amount?: number;
        categoryId?: string;
        supplierId?: string | null;
        date?: Date;
    }): Expense;
    softDelete(at?: Date): Expense;
    static validateDescription(description: string): string;
}
//# sourceMappingURL=expense.entity.d.ts.map