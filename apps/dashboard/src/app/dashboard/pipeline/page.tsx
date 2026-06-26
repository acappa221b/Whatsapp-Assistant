'use client'

import { useCallback, useEffect, useState } from 'react'

type PipelineJobRow = {
  id: string
  messageId: string
  messageType: string
  status: string
  processor: string | null
  metadata: Record<string, unknown>
  error: string | null
  queuedAt: string | null
  startedAt: string | null
  processedAt: string | null
  durationMs: number | null
  inQueue: boolean
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'PROCESSED':
      return 'bg-green-100 text-green-800'
    case 'FAILED':
      return 'bg-red-100 text-red-800'
    case 'SKIPPED':
      return 'bg-yellow-100 text-yellow-800'
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-800'
    case 'QUEUED':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function PipelinePage() {
  const [jobs, setJobs] = useState<PipelineJobRow[]>([])
  const [queueSize, setQueueSize] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    const response = await fetch('/api/pipeline/jobs')
    const data = (await response.json()) as { items: PipelineJobRow[]; queueSize: number }
    setJobs(data.items)
    setQueueSize(data.queueSize)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadJobs()
    const interval = setInterval(() => void loadJobs(), 5000)
    return () => clearInterval(interval)
  }, [loadJobs])

  async function requeue(messageId: string) {
    await fetch(`/api/pipeline/jobs/${messageId}/requeue`, { method: 'POST' })
    await loadJobs()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pipeline de Processamento</h1>
        <p className="text-sm text-muted-foreground">
          Fila de mensagens WhatsApp aguardando ou em processamento (stubs — sem IA/OCR).
        </p>
      </div>

      <div className="rounded-lg border px-4 py-3 text-sm">
        Fila atual: <strong>{queueSize}</strong> mensagem(ns)
      </div>

      {loading && jobs.length === 0 ? (
        <p className="text-sm">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Fila</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Processor</th>
                <th className="px-4 py-3">Tempo</th>
                <th className="px-4 py-3">Erro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t">
                  <td className="px-4 py-3">{job.inQueue ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{job.messageType}</td>
                  <td className="px-4 py-3">{job.processor ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {job.durationMs != null ? `${job.durationMs} ms` : '—'}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-red-600">{job.error ?? '—'}</td>
                  <td className="px-4 py-3">
                    {(job.status === 'FAILED' || job.status === 'SKIPPED') && (
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-xs hover:bg-muted"
                        onClick={() => void requeue(job.messageId)}
                      >
                        Reprocessar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum job de processamento ainda.
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
