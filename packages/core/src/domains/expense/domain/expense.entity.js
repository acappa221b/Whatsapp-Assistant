import { ValidationError } from '@finance-ai/shared/errors';
import { ConfidenceScore } from '../../../domain/value-objects/confidence-score';
import { ExpenseSourceVO } from '../../../domain/value-objects/enums';
import { Money } from '../../../domain/value-objects/money';
import { validateFutureDate } from '../../../domain/utils';
export class Expense {
    id;
    description;
    amount;
    categoryId;
    supplierId;
    date;
    source;
    confidence;
    createdAt;
    updatedAt;
    deletedAt;
    constructor(props) {
        this.id = props.id;
        this.description = props.description;
        this.amount = props.amount;
        this.categoryId = props.categoryId;
        this.supplierId = props.supplierId;
        this.date = props.date;
        this.source = props.source;
        this.confidence = props.confidence;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.deletedAt = props.deletedAt;
    }
    static create(input) {
        const description = Expense.validateDescription(input.description);
        const amount = Money.create(input.amount).amount;
        ExpenseSourceVO.create(input.source);
        const confidence = ConfidenceScore.defaultForSource(input.source, input.confidence).value;
        validateFutureDate(input.date);
        const now = input.now ?? new Date();
        return new Expense({
            id: input.id,
            description,
            amount,
            categoryId: input.categoryId,
            supplierId: input.supplierId ?? null,
            date: input.date,
            source: input.source,
            confidence,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }
    static reconstitute(props) {
        return new Expense(props);
    }
    get isDeleted() {
        return this.deletedAt !== null;
    }
    update(input) {
        if (this.isDeleted) {
            throw new ValidationError('Cannot update deleted expense');
        }
        const description = input.description !== undefined ? Expense.validateDescription(input.description) : this.description;
        const amount = input.amount !== undefined ? Money.create(input.amount).amount : this.amount;
        const date = input.date ?? this.date;
        if (input.date)
            validateFutureDate(date);
        return new Expense({
            id: this.id,
            description,
            amount,
            categoryId: input.categoryId ?? this.categoryId,
            supplierId: input.supplierId !== undefined ? input.supplierId : this.supplierId,
            date,
            source: this.source,
            confidence: this.confidence,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            deletedAt: this.deletedAt,
        });
    }
    softDelete(at = new Date()) {
        if (this.isDeleted) {
            throw new ValidationError('Expense is already deleted');
        }
        return new Expense({
            ...this,
            updatedAt: at,
            deletedAt: at,
        });
    }
    static validateDescription(description) {
        const trimmed = description.trim();
        if (trimmed.length < 1) {
            throw new ValidationError('Description is required');
        }
        if (trimmed.length > 500) {
            throw new ValidationError('Description must be at most 500 characters');
        }
        return trimmed;
    }
}
//# sourceMappingURL=expense.entity.js.map