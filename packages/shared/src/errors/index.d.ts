export declare class InfrastructureError extends Error {
    readonly code: string;
    constructor(code: string, message: string, options?: {
        cause?: unknown;
    });
}
export declare class ValidationError extends InfrastructureError {
    constructor(message: string, options?: {
        cause?: unknown;
    });
}
//# sourceMappingURL=index.d.ts.map