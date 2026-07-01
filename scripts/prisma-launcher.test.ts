import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockResolve = vi.fn()
const mockExistsSync = vi.fn()
const mockStatSync = vi.fn()
const mockReaddirSync = vi.fn()

vi.mock('node:module', () => ({
  createRequire: () => ({ resolve: mockResolve }),
}))

vi.mock('node:fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  statSync: (...args: unknown[]) => mockStatSync(...args),
  readdirSync: (...args: unknown[]) => mockReaddirSync(...args),
}))

vi.mock('./resolve-app-root.mjs', () => ({
  resolveAppRoot: () => 'C:/fake-root',
}))

type PrismaLauncher = typeof import('./prisma-launcher.mjs')

describe('prisma-launcher', () => {
  let launcher: PrismaLauncher

  beforeEach(async () => {
    vi.resetModules()
    mockResolve.mockReset()
    mockExistsSync.mockReset()
    mockStatSync.mockReset()
    mockReaddirSync.mockReset()
    mockReaddirSync.mockReturnValue([])
    launcher = await import('./prisma-launcher.mjs')
  })

  it('needsPrismaGenerate returns true when only @prisma/client npm package exists', () => {
    mockResolve.mockImplementation((id: string) => {
      if (id === '@prisma/client') return 'C:/fake-root/node_modules/@prisma/client/index.js'
      throw new Error(`Cannot find module '${id}'`)
    })
    mockExistsSync.mockImplementation((path: string) => {
      const normalized = String(path).replace(/\\/g, '/')
      return !normalized.includes('.prisma/client')
    })

    expect(launcher.isGeneratedPrismaClientReady()).toBe(false)
    expect(launcher.prismaClientExists()).toBe(false)
    expect(launcher.needsPrismaGenerate()).toBe(true)
  })

  it('needsPrismaGenerate returns false when engine exists and schema is older', () => {
    const enginePath = 'C:/fake-root/node_modules/.prisma/client/index.js'
    mockResolve.mockImplementation((id: string) => {
      if (id === '.prisma/client/index') return enginePath
      throw new Error(`Cannot find module '${id}'`)
    })
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockImplementation((path: string) => ({
      mtimeMs: String(path).includes('schema.prisma') ? 1000 : 2000,
    }))

    expect(launcher.isGeneratedPrismaClientReady()).toBe(true)
    expect(launcher.needsPrismaGenerate()).toBe(false)
  })

  it('needsPrismaGenerate returns true when schema is newer than engine', () => {
    const enginePath = 'C:/fake-root/node_modules/.prisma/client/index.js'
    mockResolve.mockImplementation((id: string) => {
      if (id === '.prisma/client/index') return enginePath
      throw new Error(`Cannot find module '${id}'`)
    })
    mockExistsSync.mockReturnValue(true)
    mockStatSync.mockImplementation((path: string) => ({
      mtimeMs: String(path).includes('schema.prisma') ? 3000 : 2000,
    }))

    expect(launcher.needsPrismaGenerate()).toBe(true)
  })
})
