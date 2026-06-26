export type SupplierProps = {
    id: string;
    name: string;
    document: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};
export declare class Supplier {
    readonly id: string;
    readonly name: string;
    readonly document: string | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date | null;
    private constructor();
    static create(input: {
        id: string;
        name: string;
        document?: string | null;
        now?: Date;
    }): Supplier;
    static reconstitute(props: SupplierProps): Supplier;
    get isDeleted(): boolean;
    update(input: {
        name?: string;
        document?: string | null;
    }): Supplier;
    softDelete(at?: Date): Supplier;
    static validateName(name: string): string;
    static namesEqual(a: string, b: string): boolean;
}
//# sourceMappingURL=supplier.entity.d.ts.map