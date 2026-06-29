import { formatChatListLabel } from '@finance-ai/shared/utils'

export type ReportSnippet = {
  chatId: string
  displayNumber: number
  name: string | null
  reportDate: Date
  content: string
}

export type MessageSnippet = {
  chatId: string
  displayNumber: number
  name: string | null
  content: string
  receivedAt: Date
  fromMe: boolean
  messageType: string
}

export type KnowledgeQueryPort = {
  loadReports(since: Date): Promise<ReportSnippet[]>
  loadMessages(since: Date, chatIds: string[]): Promise<MessageSnippet[]>
}

export type KnowledgeLlmPort = {
  answer(input: { question: string; context: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> }): Promise<string>
}

export class QueryAssistantKnowledgeUseCase {
  constructor(
    private readonly knowledge: KnowledgeQueryPort,
    private readonly llm: KnowledgeLlmPort,
    private readonly lookbackDays = 90,
  ) {}

  async execute(input: {
    question: string
    sources: ('reports' | 'messages' | 'both')[]
    history?: Array<{ role: 'user' | 'assistant'; content: string }>
  }): Promise<string> {
    const since = new Date()
    since.setDate(since.getDate() - this.lookbackDays)

    const useReports = input.sources.includes('reports') || input.sources.includes('both')
    const useMessages = input.sources.includes('messages') || input.sources.includes('both')

    const reports = useReports ? await this.knowledge.loadReports(since) : []
    const enabledChatIds = [...new Set(reports.map((r) => r.chatId))]
    const messages =
      useMessages && enabledChatIds.length
        ? await this.knowledge.loadMessages(since, enabledChatIds)
        : useMessages
          ? await this.knowledge.loadMessages(since, [])
          : []

    const reportBlock = reports.length
      ? reports
          .map((report) => {
            const label = formatChatListLabel(report.displayNumber, report.name)
            const date = report.reportDate.toISOString().slice(0, 10)
            return `### ${label} — ${date}\n${report.content}`
          })
          .join('\n\n')
      : '(nenhum relatório no período)'

    const messageBlock = messages.length
      ? messages
          .map((msg) => {
            const label = formatChatListLabel(msg.displayNumber, msg.name)
            const date = msg.receivedAt.toISOString().slice(0, 10)
            const direction = msg.fromMe ? 'OUT' : 'IN'
            return `### ${label} — ${date}\n[${direction}] ${msg.content}`
          })
          .join('\n\n')
      : '(nenhuma mensagem no período)'

    const context = [
      '## Relatórios',
      reportBlock,
      '## Mensagens recentes',
      messageBlock,
    ].join('\n\n')

    return this.llm.answer({
      question: input.question,
      context,
      history: input.history,
    })
  }
}
