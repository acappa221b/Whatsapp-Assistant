'use client'

import { useCallback, useEffect, useState } from 'react'

type ExtractionRow = {
  id: string
  messageId: string
  messageContent: string
  sender: string
  sourceType: string
  messageType: string
  type: string
  confidence: number
  processingTimeMs: number | null
  tokensInput: number | null
  tokensOutput: number | null
  model: string
  mimeType: string | null
  fileName: string | null
  fileSize: number | null
  storagePath: string | null
  previewUrl: string | null
  downloadUrl: string | null
  status: string
  data: Record<string, unknown>
  createdAt: string
}

export default function ExtractionsPage() {
  const [items, setItems] = useState<ExtractionRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadExtractions = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/extractions')
    const data = (await response.json()) as { items: ExtractionRow[] }
    setItems(data.items)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadExtractions()
    const interval = setInterval(() => void loadExtractions(), 5000)
    return () => clearInterval(interval)
  }, [loadExtractions])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Extrações por IA</h1>
        <p className="text-sm text-muted-foreground">
          Candidatos estruturados auditáveis gerados a partir das mensagens, sem criar Expense ou Revenue.
        </p>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-sm">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Mensagem</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Confiança</th>
                <th className="px-4 py-3">Modelo</th>
                <th className="px-4 py-3">Tempo</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dados extraídos</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.sender}</div>
                    <div className="max-w-md text-muted-foreground">{item.messageContent || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{item.sourceType}</td>
                  <td className="px-4 py-3">{item.type}</td>
                  <td className="px-4 py-3">{item.confidence.toFixed(2)}</td>
                  <td className="px-4 py-3">{item.model}</td>
                  <td className="px-4 py-3">
                    {item.processingTimeMs !== null ? `${item.processingTimeMs} ms` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {item.tokensInput !== null || item.tokensOutput !== null
                      ? `${item.tokensInput ?? 0}/${item.tokensOutput ?? 0}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div>{item.fileName ?? item.storagePath ?? '—'}</div>
                    {item.previewUrl && (
                      <div className="mt-1 flex gap-3 text-xs">
                        <a className="underline" href={item.previewUrl} target="_blank" rel="noreferrer">
                          Preview
                        </a>
                        <a className="underline" href={item.downloadUrl ?? item.previewUrl}>
                          Download
                        </a>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">
                    <pre className="max-w-md whitespace-pre-wrap break-words text-xs">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma extração criada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
