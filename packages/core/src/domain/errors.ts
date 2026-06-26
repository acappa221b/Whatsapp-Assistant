export class NotFoundError extends Error {
  readonly code = 'NOT_FOUND'

  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  readonly code = 'CONFLICT'

  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN'

  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class AlreadyDeletedError extends Error {
  readonly code = 'ALREADY_DELETED'

  constructor(entity: string) {
    super(`${entity} is already deleted`)
    this.name = 'AlreadyDeletedError'
  }
}
