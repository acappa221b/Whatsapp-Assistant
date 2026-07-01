import { NextResponse } from 'next/server'
import { resolve } from 'node:path'
import { config, REPO_ROOT } from '@finance-ai/shared/config'
import { ResetWhatsappDataUseCase } from '@finance-ai/core/domains/whatsapp-data-reset'
import {
  clearWhatsappMediaStorage,
  deleteWhatsappDataInTransaction,
  prisma,
} from '@finance-ai/database'
import { getAppLogger } from '@/lib/logging/app-log-sink'
import { ensureWhatsappReady, resetWhatsappRuntimeAfterDataWipe } from '@/lib/whatsapp/runtime'

export async function POST(request: Request) {
  await ensureWhatsappReady()

  let body: { confirm?: string }
  try {
    body = (await request.json()) as { confirm?: string }
  } catch {
    return NextResponse.json({ error: 'Corpo JSON inválido' }, { status: 400 })
  }

  if (body.confirm !== 'RESETAR') {
    return NextResponse.json(
      { error: 'Confirmação inválida. Digite RESETAR para continuar.' },
      { status: 400 },
    )
  }

  const mediaRoot = resolve(REPO_ROOT, config.storage.mediaPath)
  const useCase = new ResetWhatsappDataUseCase(
    {
      deleteWhatsappData: () => deleteWhatsappDataInTransaction(prisma),
      clearMediaStorage: () => clearWhatsappMediaStorage(mediaRoot),
    },
    {
      onAfterReset: resetWhatsappRuntimeAfterDataWipe,
      log: (message, meta) => getAppLogger().info(message, meta),
    },
  )

  try {
    const result = await useCase.execute()
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao resetar dados'
    getAppLogger().error('[settings/reset-whatsapp-data] Falha', { message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
