import { ValidationError } from '@finance-ai/shared/errors';
export class Money {
    amount;
    constructor(amount) {
        this.amount = amount;
    }
    static create(value) {
        if (!Number.isFinite(value)) {
            throw new ValidationError('Amount must be a finite number');
        }
        const rounded = Math.round(value * 100) / 100;
        if (rounded <= 0) {
            throw new ValidationError('Amount must be greater than zero');
        }
        if (rounded < 0.01) {
            throw new ValidationError('Amount must be at least 0.01');
        }
        if (Math.abs(value - rounded) > Number.EPSILON) {
            throw new ValidationError('Amount must have at most 2 decimal places');
        }
        return new Money(rounded);
    }
}
//# sourceMappingURL=money.js.map