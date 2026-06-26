import { ValidationError } from '@finance-ai/shared/errors';
import { Email } from '../../../domain/value-objects/email';
import { UserRoleVO } from '../../../domain/value-objects/enums';
import { normalizeName } from '../../../domain/utils';
export class User {
    id;
    name;
    email;
    role;
    createdAt;
    updatedAt;
    constructor(props) {
        this.id = props.id;
        this.name = props.name;
        this.email = props.email;
        this.role = props.role;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    static create(input) {
        const name = User.validateName(input.name);
        const email = Email.create(input.email).value;
        const role = UserRoleVO.create(input.role ?? 'VIEWER').value;
        const now = input.now ?? new Date();
        return new User({ id: input.id, name, email, role, createdAt: now, updatedAt: now });
    }
    static reconstitute(props) {
        return new User(props);
    }
    update(input) {
        const name = input.name !== undefined ? User.validateName(input.name) : this.name;
        const email = input.email !== undefined ? Email.create(input.email).value : this.email;
        const role = input.role !== undefined ? UserRoleVO.create(input.role).value : this.role;
        return new User({
            id: this.id,
            name,
            email,
            role,
            createdAt: this.createdAt,
            updatedAt: new Date(),
        });
    }
    static validateName(name) {
        const normalized = normalizeName(name);
        if (normalized.length < 2) {
            throw new ValidationError('User name must be at least 2 characters');
        }
        if (normalized.length > 150) {
            throw new ValidationError('User name must be at most 150 characters');
        }
        return normalized;
    }
}
//# sourceMappingURL=user.entity.js.map