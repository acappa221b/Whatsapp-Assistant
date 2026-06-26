import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export type BaileysConnectionUpdate = {
  connection?: 'close' | 'open' | 'connecting'
  qr?: string
  lastDisconnect?: {
    error?: {
      message?: string
      output?: {
        statusCode?: number
        payload?: unknown
      }
      data?: unknown
    }
  }
  receivedAt?: string
  isNewLogin?: boolean
  legacy?: boolean
  [key: string]: unknown
}

export function getBaileysPackageVersion(): string {
  const candidates = [
    join(process.cwd(), 'node_modules', '@whiskeysockets', 'baileys', 'package.json'),
    join(process.cwd(), '..', 'node_modules', '@whiskeysockets', 'baileys', 'package.json'),
    join(process.cwd(), '..', '..', 'node_modules', '@whiskeysockets', 'baileys', 'package.json'),
  ]

  for (const packageJsonPath of candidates) {
    try {
      if (!existsSync(packageJsonPath)) continue
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version?: string }
      return packageJson.version ?? 'unknown'
    } catch {
      continue
    }
  }

  return 'unknown'
}

export function isValidAuthSession(authDir: string): boolean {
  const session = inspectAuthSession(authDir)
  if (!session.exists || session.fileCount === 0) return false

  const credsPath = join(authDir, 'creds.json')
  if (!existsSync(credsPath)) {
    return session.files.some((file) => file.name.endsWith('.json') && file.sizeBytes > 0)
  }

  try {
    const creds = JSON.parse(readFileSync(credsPath, 'utf-8')) as {
      registered?: boolean
      me?: { id?: string } | null
    }
    if (creds.me?.id) return true
    if (creds.registered === true) return true
    return false
  } catch {
    return false
  }
}

export function getOwnJidFromAuthSession(authDir: string): string | null {
  const credsPath = join(authDir, 'creds.json')
  if (!existsSync(credsPath)) return null
  try {
    const creds = JSON.parse(readFileSync(credsPath, 'utf-8')) as {
      me?: { id?: string } | null
    }
    return creds.me?.id?.trim() || null
  } catch {
    return null
  }
}

export function inspectAuthSession(authDir: string): {
  absolutePath: string
  exists: boolean
  fileCount: number
  files: Array<{ name: string; sizeBytes: number }>
} {
  const absolutePath = authDir
  const exists = existsSync(authDir)
  if (!exists) {
    return { absolutePath, exists: false, fileCount: 0, files: [] }
  }

  const files = readdirSync(authDir).map((name) => {
    const filePath = join(authDir, name)
    const stats = statSync(filePath)
    return {
      name,
      sizeBytes: stats.isFile() ? stats.size : 0,
    }
  })

  return {
    absolutePath,
    exists: true,
    fileCount: files.length,
    files,
  }
}

export function serializeConnectionUpdate(update: BaileysConnectionUpdate): Record<string, unknown> {
  const error = update.lastDisconnect?.error
  return {
    receivedAt: update.receivedAt ?? new Date().toISOString(),
    connection: update.connection ?? null,
    qrPresent: Boolean(update.qr),
    qrLength: update.qr?.length ?? 0,
    qrPreview: update.qr ? `${update.qr.slice(0, 24)}...` : null,
    isNewLogin: update.isNewLogin ?? null,
    legacy: update.legacy ?? null,
    lastDisconnect: update.lastDisconnect
      ? {
          error: error
            ? {
                message: error.message ?? null,
                output: error.output
                  ? {
                      statusCode: error.output.statusCode ?? null,
                      payload: error.output.payload ?? null,
                    }
                  : null,
                data: error.data ?? null,
              }
            : null,
        }
      : null,
    rawKeys: Object.keys(update),
  }
}

export function logAuthStateLoaded(input: {
  authDir: string
  baileysVersion: string
  stateLoaded: boolean
  hasCreds: boolean
}): void {
  const session = inspectAuthSession(input.authDir)
  console.info('[baileys/diagnostic] auth state load', {
    baileysVersion: input.baileysVersion,
    stateLoaded: input.stateLoaded,
    hasCreds: input.hasCreds,
    sessionAbsolutePath: session.absolutePath,
    sessionExists: session.exists,
    sessionFileCount: session.fileCount,
    sessionFiles: session.files,
  })
}

export function logConnectionUpdate(update: BaileysConnectionUpdate): void {
  const payload = serializeConnectionUpdate({
    ...update,
    receivedAt: new Date().toISOString(),
  })
  console.info('[baileys/diagnostic] connection.update', JSON.stringify(payload, null, 2))
}

export function logProviderQrReceived(input: {
  qrLength: number
  providerStatus: string
  qrDataUrlGenerated: boolean
}): void {
  console.info('[baileys/diagnostic] provider qr received', input)
}

export function logProviderStatusChange(status: {
  status: string
  qrCode: string | null
  qrCodeDataUrl: string | null
}): void {
  console.info('[baileys/diagnostic] provider status change', {
    status: status.status,
    qrCodePresent: Boolean(status.qrCode),
    qrCodeLength: status.qrCode?.length ?? 0,
    qrCodeDataUrlPresent: Boolean(status.qrCodeDataUrl),
    qrCodeDataUrlLength: status.qrCodeDataUrl?.length ?? 0,
  })
}
