import { ValidationError } from '@finance-ai/shared/errors';
import { normalizeName } from '../../../domain/utils';
export class Supplier {
    id;
    name;
    document;
    createdAt;
    updatedAt;
    deletedAt;
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.document = props.document;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.deletedAt = props.deletedAt;
    }
    static create(input) {
        const name = Supplier.validateName(input.name);
        const now = input.now ?? new Date();
        return new Supplier({
            id: input.id,
            name,
            document: input.document ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }
    static reconstitute(props) {
        return new Supplier(props);
    }
    get isDeleted() {
        return this.deletedAt !== null;
    }
    update(input) {
        if (this.isDeleted) {
            throw new ValidationError('Cannot update deleted supplier');
        }
        const name = input.name !== undefined ? Supplier.validateName(input.name) : this.name;
        const document = input.document !== undefined ? input.document : this.document;
        return new Supplier({
            id: this.id,
            name,
            document,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            deletedAt: this.deletedAt,
        });
    }
    softDelete(at = new Date()) {
        if (this.isDeleted) {
            throw new ValidationError('Supplier is already deleted');
        }
        return new Supplier({
            ...this,
            updatedAt: at,
            deletedAt: at,
        });
    }
    static validateName(name) {
        const normalized = normalizeName(name);
        if (normalized.length < 2) {
            throw new ValidationError('Supplier name must be at least 2 characters');
        }
        if (normalized.length > 200) {
            throw new ValidationError('Supplier name must be at most 200 characters');
        }
        return normalized;
    }
    static namesEqual(a, b) {
        return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase();
    }
}
//# sourceMappingURL=supplier.entity.js.map