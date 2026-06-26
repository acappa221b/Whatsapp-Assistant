import { ValidationError } from '@finance-ai/shared/errors';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export class Email {
    value;
    constructor(value) {
        this.value = value;
    }
    static create(raw) {
        const normalized = raw.trim().toLowerCase();
        if (!EMAIL_REGEX.test(normalized)) {
            throw new ValidationError('Invalid email format');
        }
        return new Email(normalized);
    }
    equals(other) {
        return this.value === other.value;
    }
}
//# sourceMappingURL=email.js.map