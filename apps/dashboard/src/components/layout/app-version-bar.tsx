'use client'

import { useAppVersion } from '@/hooks/use-app-version'

export function AppVersionBar() {
  const { data } = useAppVersion()

  if (!data) return null

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
        v{data.version}
      </span>
      {data.updateAvailable && data.latestVersion ? (
        <span
          className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600"
          title={`Nova versao ${data.latestVersion} disponivel`}
        >
          Atualizacao disponivel
        </span>
      ) : null}
    </div>
  )
}
