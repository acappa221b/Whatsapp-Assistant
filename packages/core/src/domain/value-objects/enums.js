import { ValidationError } from '@finance-ai/shared/errors';
export const USER_ROLES = ['ADMIN', 'MANAGER', 'VIEWER'];
export class UserRoleVO {
    value;
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!USER_ROLES.includes(value)) {
            throw new ValidationError(`Invalid role: ${value}`);
        }
        return new UserRoleVO(value);
    }
}
export const CATEGORY_TYPES = ['EXPENSE', 'REVENUE'];
export class CategoryTypeVO {
    value;
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!CATEGORY_TYPES.includes(value)) {
            throw new ValidationError(`Invalid category type: ${value}`);
        }
        return new CategoryTypeVO(value);
    }
}
export const EXPENSE_SOURCES = [
    'MANUAL',
    'WHATSAPP_TEXT',
    'WHATSAPP_IMAGE',
    'OCR',
    'IMPORT',
];
export class ExpenseSourceVO {
    value;
    constructor(value) {
        this.value = value;
    }
    static create(value) {
        if (!EXPENSE_SOURCES.includes(value)) {
            throw new ValidationError(`Invalid expense source: ${value}`);
        }
        return new ExpenseSourceVO(value);
    }
}
//# sourceMappingURL=enums.js.map