import { applyConfigToProcessEnv, createConfig, resetConfigCache } from '@finance-ai/shared/config'
import { validateRuntimeStartup } from '@finance-ai/database'
import { bootstrapAppSettings } from '@/lib/bootstrap/app-settings'

let startupPromise: Promise<void> | null = null

export function ensureServerReady(): Promise<void> {
  if (!startupPromise) {
    startupPromise = (async () => {
      resetConfigCache()
      const resolved = createConfig()
      applyConfigToProcessEnv(resolved)
      await validateRuntimeStartup(resolved)
      await bootstrapAppSettings()
    })().catch((error) => {
      startupPromise = null
      throw error
    })
  }

  return startupPromise
}
