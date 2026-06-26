import { ExpenseSource } from '../../../domain/value-objects/enums';
export type RevenueProps = {
    id: string;
    description: string;
    amount: number;
    date: Date;
    source: ExpenseSource;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};
export declare class Revenue {
    readonly id: string;
    readonly description: string;
    readonly amount: number;
    readonly date: Date;
    readonly source: ExpenseSource;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    private constructor();
    static create(input: {
        id: string;
        description: string;
        amount: number;
        date: Date;
        source: ExpenseSource;
        now?: Date;
    }): Revenue;
    static reconstitute(props: RevenueProps): Revenue;
    get isDeleted(): boolean;
    update(input: {
        description?: string;
        amount?: number;
        date?: Date;
    }): Revenue;
    softDelete(at?: Date): Revenue;
    static validateDescription(description: string): string;
}
//# sourceMappingURL=revenue.entity.d.ts.map