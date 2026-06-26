import { ValidationError } from '@finance-ai/shared/errors';
import { CategoryTypeVO } from '../../../domain/value-objects/enums';
import { normalizeName } from '../../../domain/utils';
export class Category {
    id;
    name;
    type;
    createdAt;
    updatedAt;
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.type = props.type;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    static create(input) {
        const name = Category.validateAndNormalizeName(input.name);
        CategoryTypeVO.create(input.type);
        const now = input.now ?? new Date();
        return new Category({ id: input.id, name, type: input.type, createdAt: now, updatedAt: now });
    }
    static reconstitute(props) {
        return new Category(props);
    }
    updateName(name) {
        const normalized = Category.validateAndNormalizeName(name);
        return new Category({
            id: this.id,
            name: normalized,
            type: this.type,
            createdAt: this.createdAt,
            updatedAt: new Date(),
        });
    }
    static validateAndNormalizeName(name) {
        const normalized = normalizeName(name);
        if (normalized.length < 2) {
            throw new ValidationError('Category name must be at least 2 characters');
        }
        if (normalized.length > 100) {
            throw new ValidationError('Category name must be at most 100 characters');
        }
        return normalized;
    }
    static namesEqual(a, b) {
        return normalizeName(a).toLowerCase() === normalizeName(b).toLowerCase();
    }
}
//# sourceMappingURL=category.entity.js.map