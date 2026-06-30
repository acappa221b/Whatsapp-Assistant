'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAppVersion } from '@/hooks/use-app-version'

type SettingsAboutSectionProps = {
  updateCheckEnabled?: boolean
  onUpdateCheckEnabledChange?: (enabled: boolean) => void
}

export function SettingsAboutSection({
  updateCheckEnabled = true,
  onUpdateCheckEnabledChange,
}: SettingsAboutSectionProps) {
  const { data, loading, refresh } = useAppVersion()
  const [showHelp, setShowHelp] = useState(false)

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground">Carregando informacoes da versao…</p>
  }
  if (!data) return null

  const repoUrl =
    data.github?.owner && data.github?.repo
      ? `https://github.com/${data.github.owner}/${data.github.repo}`
      : null

  const methodLabel =
    data.lastLocalUpdateMethod === 'git'
      ? 'Git'
      : data.lastLocalUpdateMethod === 'zip'
        ? 'ZIP'
        : null

  return (
    <div className="space-y-3 text-sm">
      <div>
        <span className="text-muted-foreground">Versao instalada:</span>{' '}
        <span className="font-mono">v{data.version}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Ultima verificacao:</span>{' '}
        {new Date(data.checkedAt).toLocaleString('pt-BR')}
      </div>
      {data.lastLocalUpdateAt ? (
        <div>
          <span className="text-muted-foreground">Ultima atualizacao:</span>{' '}
          {new Date(data.lastLocalUpdateAt).toLocaleString('pt-BR')}
          {methodLabel ? ` (${methodLabel})` : null}
        </div>
      ) : null}
      {data.updateAvailable && data.latestVersion ? (
        <p className="text-amber-600">Atualizacao disponivel: v{data.latestVersion}</p>
      ) : (
        <p className="text-muted-foreground">Voce esta na versao mais recente conhecida.</p>
      )}
      {data.checkError ? (
        <p className="text-xs text-muted-foreground">Verificacao remota: {data.checkError}</p>
      ) : null}
      {onUpdateCheckEnabledChange ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={updateCheckEnabled}
            onChange={(e) => onUpdateCheckEnabledChange(e.target.checked)}
          />
          Verificar atualizacoes automaticamente no dashboard
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
          Verificar atualizacoes agora
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowHelp((v) => !v)}>
          Como atualizar
        </Button>
        {repoUrl ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
          >
            GitHub releases
          </a>
        ) : null}
      </div>
      {showHelp ? (
        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p>Feche o programa e abra de novo Start WhatsApp Assistant.bat.</p>
          <p className="mt-2">
            Se houver versao nova, o programa pergunta se quer atualizar. Chats, WhatsApp e
            configuracoes em storage/ e no banco local sao preservados.
          </p>
          <p className="mt-2">
            ZIP do GitHub: atualizacao automatica por download. Clone Git: git pull automatico.
          </p>
        </div>
      ) : null}
    </div>
  )
}
