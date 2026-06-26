import { ValidationError } from '@finance-ai/shared/errors';
import { ExpenseSourceVO } from '../../../domain/value-objects/enums';
import { Money } from '../../../domain/value-objects/money';
import { validateFutureDate } from '../../../domain/utils';
export class Revenue {
    id;
    description;
    amount;
    date;
    source;
    createdAt;
    updatedAt;
    deletedAt;
    constructor(props) {
        this.id = props.id;
        this.description = props.description;
        this.amount = props.amount;
        this.date = props.date;
        this.source = props.source;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.deletedAt = props.deletedAt;
    }
    static create(input) {
        const description = Revenue.validateDescription(input.description);
        const amount = Money.create(input.amount).amount;
        ExpenseSourceVO.create(input.source);
        validateFutureDate(input.date);
        const now = input.now ?? new Date();
        return new Revenue({
            id: input.id,
            description,
            amount,
            date: input.date,
            source: input.source,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }
    static reconstitute(props) {
        return new Revenue(props);
    }
    get isDeleted() {
        return this.deletedAt !== null;
    }
    update(input) {
        if (this.isDeleted) {
            throw new ValidationError('Cannot update deleted revenue');
        }
        const description = input.description !== undefined ? Revenue.validateDescription(input.description) : this.description;
        const amount = input.amount !== undefined ? Money.create(input.amount).amount : this.amount;
        const date = input.date ?? this.date;
        if (input.date)
            validateFutureDate(date);
        return new Revenue({
            id: this.id,
            description,
            amount,
            date,
            source: this.source,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            deletedAt: this.deletedAt,
        });
    }
    softDelete(at = new Date()) {
        if (this.isDeleted) {
            throw new ValidationError('Revenue is already deleted');
        }
        return new Revenue({
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
//# sourceMappingURL=revenue.entity.js.map