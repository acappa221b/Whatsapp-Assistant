import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Harness } from '../types'
import { createResult } from '../types'

const ROOT = join(import.meta.dirname, '../..')

function read(path: string): string {
  return readFileSync(join(ROOT, path), 'utf-8')
}

export const StartupReconnectHarness: Harness = {
  name: 'StartupReconnectHarness',
  async run() {
    const errors: string[] = []
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')
    const statusRoute = read('apps/dashboard/src/app/api/whatsapp/status/route.ts')

    if (!runtime.includes('export async function bootstrapWhatsappRuntime')) {
      errors.push('runtime.ts must export bootstrapWhatsappRuntime')
    }
    if (!runtime.includes('export async function ensureWhatsappReady')) {
      errors.push('runtime.ts must export ensureWhatsappReady for lazy bootstrap')
    }
    if (!runtime.includes('isValidAuthSession')) {
      errors.push('runtime bootstrap must validate session with isValidAuthSession')
    }
    if (!runtime.includes('await provider.connect()')) {
      errors.push('runtime bootstrap must auto-connect with provider.connect()')
    }
    if (!statusRoute.includes('ensureWhatsappReady')) {
      errors.push('status route must call ensureWhatsappReady (triggers bootstrap on first request)')
    }

    return createResult(this.name, errors)
  },
}

export const SessionRestoreHarness: Harness = {
  name: 'SessionRestoreHarness',
  async run() {
    const errors: string[] = []
    const connectRoute = 'apps/dashboard/src/app/api/whatsapp/connect/route.ts'
    const reconnectRoute = 'apps/dashboard/src/app/api/whatsapp/reconnect/route.ts'
    const resetRoute = 'apps/dashboard/src/app/api/whatsapp/reset-session/route.ts'

    if (!existsSync(join(ROOT, reconnectRoute))) {
      errors.push('Missing POST /api/whatsapp/reconnect route')
    }
    if (!existsSync(join(ROOT, resetRoute))) {
      errors.push('Missing POST /api/whatsapp/reset-session route')
    }

    const connect = read(connectRoute)
    const reconnect = read(reconnectRoute)
    const reset = read(resetRoute)

    if (connect.includes('connectFresh')) {
      errors.push('connect route must not call connectFresh')
    }
    if (!connect.includes('provider.connect()')) {
      errors.push('connect route must call provider.connect()')
    }
    if (!reconnect.includes('provider.connect()')) {
      errors.push('reconnect route must call provider.connect()')
    }
    if (!reset.includes('connectFresh')) {
      errors.push('reset-session route must call connectFresh')
    }

    return createResult(this.name, errors)
  },
}

export const PipelineBootstrapHarness: Harness = {
  name: 'PipelineBootstrapHarness',
  async run() {
    const errors: string[] = []
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')

    if (!runtime.includes('ensureWhatsappPipelinesRegistered()')) {
      errors.push('bootstrap must register whatsapp pipelines')
    }

    const pipelineRuntime = read('apps/dashboard/src/lib/pipeline/runtime.ts')
    if (!pipelineRuntime.includes('ensureProcessingPipelineRegistered')) {
      errors.push('pipeline runtime must expose ensureProcessingPipelineRegistered')
    }

    const messagesRoute = read('apps/dashboard/src/app/api/whatsapp/messages/route.ts')
    if (!messagesRoute.includes('ensureWhatsappReady')) {
      errors.push('messages route must call ensureWhatsappReady (triggers bootstrap)')
    }

    return createResult(this.name, errors)
  },
}

export const ChatDiscoveryHarness: Harness = {
  name: 'ChatDiscoveryHarness',
  async run() {
    const errors: string[] = []
    const groupDiscovery = read('packages/whatsapp/src/utils/group-discovery.ts')
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')

    if (!groupDiscovery.includes('onChatDiscovered')) {
      errors.push('group-discovery must accept onChatDiscovered callback')
    }
    if (!groupDiscovery.includes('chats.upsert')) {
      errors.push('group-discovery must listen to chats.upsert')
    }
    if (!groupDiscovery.includes('groups.update')) {
      errors.push('group-discovery must listen to groups.update')
    }
    if (!runtime.includes('onChatDiscovered')) {
      errors.push('runtime provider must wire onChatDiscovered to EnsureWhatsappChatDiscovered')
    }

    return createResult(this.name, errors)
  },
}

export const StatusApiHarness: Harness = {
  name: 'StatusApiHarness',
  async run() {
    const errors: string[] = []
    const statusRoute = read('apps/dashboard/src/app/api/whatsapp/status/route.ts')
    const runtime = read('apps/dashboard/src/lib/whatsapp/runtime.ts')
    const banner = read('apps/dashboard/src/components/whatsapp/diagnostic-banner.tsx')

    const requiredFields = [
      'connected',
      'authenticated',
      'sessionLoaded',
      'liveMessageCount',
      'chatCount',
      'groupCount',
      'lastMessageAt',
      'lastEventAt',
    ]

    for (const field of requiredFields) {
      if (!runtime.includes(field)) {
        errors.push(`getWhatsappOperationalStatus must expose ${field}`)
      }
    }

    if (!statusRoute.includes('getWhatsappOperationalStatus')) {
      errors.push('status route must use getWhatsappOperationalStatus')
    }
    if (!banner.includes('WhatsappDiagnosticBanner')) {
      errors.push('diagnostic banner component must exist')
    }

    return createResult(this.name, errors)
  },
}
