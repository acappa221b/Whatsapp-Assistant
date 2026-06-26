import { describe, expect, it } from 'vitest'
import { mapRepositoryError } from '@/lib/api-error'

describe('api error handling', () => {
  it('maps prisma not-found and schema errors to 404', () => {
    expect(mapRepositoryError({ code: 'P2025' })?.status).toBe(404)
    expect(mapRepositoryError({ code: 'P2022' })?.status).toBe(404)
    expect(mapRepositoryError(new Error('other'))).toBeNull()
  })
})
