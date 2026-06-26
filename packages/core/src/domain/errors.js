export class NotFoundError extends Error {
    code = 'NOT_FOUND';
    constructor(entity, id) {
        super(`${entity} not found: ${id}`);
        this.name = 'NotFoundError';
    }
}
export class ConflictError extends Error {
    code = 'CONFLICT';
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}
export class ForbiddenError extends Error {
    code = 'FORBIDDEN';
    constructor(message) {
        super(message);
        this.name = 'ForbiddenError';
    }
}
export class AlreadyDeletedError extends Error {
    code = 'ALREADY_DELETED';
    constructor(entity) {
        super(`${entity} is already deleted`);
        this.name = 'AlreadyDeletedError';
    }
}
//# sourceMappingURL=errors.js.map