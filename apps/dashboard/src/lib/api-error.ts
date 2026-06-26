type PrismaLikeError = {
  code?: string
}

function asPrismaError(error: unknown): PrismaLikeError | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null
  }
  return error as PrismaLikeError
}

export function isPrismaNotFoundError(error: unknown): boolean {
  return asPrismaError(error)?.code === 'P2025'
}

export function isPrismaSchemaError(error: unknown): boolean {
  const code = asPrismaError(error)?.code
  return code === 'P2021' || code === 'P2022'
}

export function mapRepositoryError(error: unknown): Response | null {
  if (isPrismaNotFoundError(error) || isPrismaSchemaError(error)) {
    return new Response('Not found', { status: 404 })
  }
  return null
}
