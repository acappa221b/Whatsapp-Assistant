export class InfrastructureError extends Error {
    code;
    constructor(code, message, options) {
        super(message, options);
        this.name = 'InfrastructureError';
        this.code = code;
    }
}
export class ValidationError extends InfrastructureError {
    constructor(message, options) {
        super('VALIDATION_ERROR', message, options);
        this.name = 'ValidationError';
    }
}
//# sourceMappingURL=index.js.map