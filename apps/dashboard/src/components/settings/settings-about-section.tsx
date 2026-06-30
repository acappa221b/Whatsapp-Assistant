'use client'

import { Button } from '@/components/ui/button'
import { useAppVersion } from '@/hooks/use-app-version'

export function SettingsAboutSection() {
  const { data, loading, refresh } = useAppVersion()

  if (loading && !data) {
    return <p className="text-sm text-muted-foreground">Carregando informacoes da versao…</p>
  }
  if (!data) return null

  const repoUrl =
    data.github?.owner && data.github?.repo
      ? `https://github.com/${data.github.owner}/${data.github.repo}`
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
      {data.updateAvailable && data.latestVersion ? (
        <p className="text-amber-600">
          Atualizacao disponivel: v{data.latestVersion}
        </p>
      ) : (
        <p className="text-muted-foreground">Voce esta na versao mais recente conhecida.</p>
      )}
      {data.checkError ? (
        <p className="text-xs text-muted-foreground">Verificacao remota: {data.checkError}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void refresh()}>
          Verificar atualizacoes agora
        </Button>
        {repoUrl ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
          >
            Repositorio GitHub
          </a>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Para atualizar com Git: feche o programa e abra novamente Start WhatsApp Assistant.bat.
      </p>
    </div>
  )
}
