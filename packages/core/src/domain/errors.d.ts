export declare class NotFoundError extends Error {
    readonly code = "NOT_FOUND";
    constructor(entity: string, id: string);
}
export declare class ConflictError extends Error {
    readonly code = "CONFLICT";
    constructor(message: string);
}
export declare class ForbiddenError extends Error {
    readonly code = "FORBIDDEN";
    constructor(message: string);
}
export declare class AlreadyDeletedError extends Error {
    readonly code = "ALREADY_DELETED";
    constructor(entity: string);
}
//# sourceMappingURL=errors.d.ts.map