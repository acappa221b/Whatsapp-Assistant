'use client'

import { useCallback, useEffect, useState } from 'react'

export type AppVersionResponse = {
  version: string
  appName: string
  updateAvailable: boolean
  latestVersion: string | null
  releaseNotes: string | null
  updateMethod: 'restart_launcher' | 'zip_overlay' | 'manual_download'
  downloadUrl: string | null
  checkedAt: string
  checkError?: string
  bannerDismissed: boolean
  hasGitRepo: boolean
  canAutoUpdateOnRestart: boolean
  lastLocalUpdateAt: string | null
  lastLocalUpdateMethod: 'git' | 'zip' | null
  github?: { owner: string; repo: string; branch?: string }
}

export function useAppVersion(refresh = false) {
  const [data, setData] = useState<AppVersionResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    try {
      const query = force || refresh ? '?refresh=1' : ''
      const res = await fetch(`/api/app/version${query}`)
      if (res.ok) {
        setData((await res.json()) as AppVersionResponse)
      }
    } finally {
      setLoading(false)
    }
  }, [refresh])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, refresh: () => load(true) }
}
