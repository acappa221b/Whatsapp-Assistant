export declare const USER_ROLES: readonly ["ADMIN", "MANAGER", "VIEWER"];
export type UserRole = (typeof USER_ROLES)[number];
export declare class UserRoleVO {
    readonly value: UserRole;
    private constructor();
    static create(value: string): UserRoleVO;
}
export declare const CATEGORY_TYPES: readonly ["EXPENSE", "REVENUE"];
export type CategoryType = (typeof CATEGORY_TYPES)[number];
export declare class CategoryTypeVO {
    readonly value: CategoryType;
    private constructor();
    static create(value: string): CategoryTypeVO;
}
export declare const EXPENSE_SOURCES: readonly ["MANUAL", "WHATSAPP_TEXT", "WHATSAPP_IMAGE", "OCR", "IMPORT"];
export type ExpenseSource = (typeof EXPENSE_SOURCES)[number];
export declare class ExpenseSourceVO {
    readonly value: ExpenseSource;
    private constructor();
    static create(value: string): ExpenseSourceVO;
}
export type RevenueSource = ExpenseSource;
//# sourceMappingURL=enums.d.ts.map