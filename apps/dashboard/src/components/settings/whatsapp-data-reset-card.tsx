'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function WhatsappDataResetCard() {
  const [confirmText, setConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    if (confirmText !== 'RESETAR') {
      setError('Digite RESETAR para confirmar.')
      return
    }
    if (
      !window.confirm(
        'Apagar todas as mensagens, chats, relatórios e mídia? Configurações e chaves IA serão mantidas.',
      )
    ) {
      return
    }

    setResetting(true)
    setError(null)
    setFeedback(null)
    try {
      const response = await fetch('/api/settings/reset-whatsapp-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESETAR' }),
      })
      const data = (await response.json()) as {
        error?: string
        deletedMessages?: number
        deletedChats?: number
        mediaFilesRemoved?: number
      }
      if (!response.ok) {
        setError(data.error ?? 'Falha ao resetar dados')
        return
      }
      setConfirmText('')
      setFeedback(
        `Dados resetados (${data.deletedMessages ?? 0} mensagens, ${data.deletedChats ?? 0} chats). ` +
          'Vá em Permissões e use Iniciar sincronização para repopular a lista.',
      )
    } catch {
      setError('Erro de rede ao resetar dados')
    } finally {
      setResetting(false)
    }
  }

  return (
    <Card className="border-destructive/40 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Zona de perigo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium">Resetar dados do WhatsApp</p>
          <p className="mt-1 text-muted-foreground">
            Apaga todas as mensagens, chats, relatórios e arquivos de mídia. Mantém configurações,
            provedores IA, persona, conhecimento e métricas do dashboard. A sessão WhatsApp permanece
            — reconecte para nova sincronização.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Digite RESETAR</span>
            <input
              className="w-40 rounded-md border bg-background px-3 py-2"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESETAR"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            disabled={resetting || confirmText !== 'RESETAR'}
            onClick={() => void handleReset()}
            className="inline-flex items-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {resetting ? 'Resetando…' : 'Resetar dados'}
          </button>
        </div>
        {feedback ? (
          <p className="text-green-700">
            {feedback}{' '}
            <Link href="/dashboard/permissions" className="underline">
              Ir para Permissões
            </Link>
          </p>
        ) : null}
        {error ? <p className="text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
