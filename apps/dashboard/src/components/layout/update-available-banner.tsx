'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AppVersionResponse } from '@/hooks/use-app-version'

export function UpdateAvailableBanner() {
  const [data, setData] = useState<AppVersionResponse | null>(null)
  const [hidden, setHidden] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/app/version')
      if (res.ok) {
        setData((await res.json()) as AppVersionResponse)
      }
    } catch {
      // non-blocking
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function dismiss() {
    if (!data?.latestVersion) {
      setHidden(true)
      return
    }
    await fetch('/api/app/version', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dismiss: true, latestVersion: data.latestVersion }),
    })
    setHidden(true)
  }

  if (!data || hidden || data.bannerDismissed || !data.updateAvailable || !data.latestVersion) {
    return null
  }

  const releaseUrl =
    data.github?.owner && data.github?.repo
      ? `https://github.com/${data.github.owner}/${data.github.repo}/releases/tag/v${data.latestVersion}`
      : data.downloadUrl

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium text-amber-900 dark:text-amber-100">
            Nova versao {data.latestVersion} disponivel
          </p>
          {data.updateMethod === 'restart_launcher' ? (
            <p className="text-muted-foreground">
              Feche esta janela e abra novamente <strong>Start WhatsApp Assistant.bat</strong> para
              atualizar automaticamente.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Baixe a versao mais recente no GitHub e substitua a pasta. Seus dados em{' '}
              <code className="text-xs">storage/</code> e o banco sao preservados.
            </p>
          )}
          {data.releaseNotes ? (
            <p className="text-xs text-muted-foreground">{data.releaseNotes}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {releaseUrl ? (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
            >
              Ver novidades
            </a>
          ) : null}
          {data.updateMethod === 'manual_download' && data.downloadUrl ? (
            <a
              href={data.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
            >
              Baixar no GitHub
            </a>
          ) : null}
          <Button type="button" size="sm" onClick={() => void dismiss()}>
            Entendi
          </Button>
        </div>
      </div>
    </div>
  )
}
