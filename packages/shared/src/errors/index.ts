export class InfrastructureError extends Error {
  readonly code: string

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'InfrastructureError'
    this.code = code
  }
}

export class ValidationError extends InfrastructureError {
  constructor(message: string, options?: { cause?: unknown }) {
    super('VALIDATION_ERROR', message, options)
    this.name = 'ValidationError'
  }
}
