import { formatChatListLabel } from '@finance-ai/shared/utils'
import {
  ComposeAssistantMessageUseCase,
  ExecuteAssistantCommandUseCase,
  QueryAssistantKnowledgeUseCase,
  ResolveAssistantTargetsUseCase,
  heuristicParse,
  type AssistantPreview,
  type AssistantCommand,
} from '@finance-ai/core/domains/assistant-ops'
import { prisma, AssistantActionLogPrismaRepository } from '@finance-ai/database'
import { getUnifiedProvider } from '@/lib/ai/ai-provider-service'
import { ensureWhatsappReady, getWhatsappRuntime } from '@/lib/whatsapp/runtime'
import { consumeActionToken, createActionToken } from './action-token-store'

export type AssistantHistoryEntry = {
  role: 'user' | 'assistant'
  content: string
}

export type AssistantChatResponse =
  | { phase: 'answer'; text: string }
  | {
      phase: 'preview'
      actionToken: string
      preview: AssistantPreview
      assistantMessage: string
    }
  | { phase: 'done'; sent: number; chatIds: string[] }
  | { phase: 'error'; message: string }

let lastSendAt = 0

function extractJsonFromText(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  const raw = fenced ?? text
  return JSON.parse(raw.trim())
}

async function loadChatConfigs() {
  return prisma.whatsappChatConfig.findMany({
    orderBy: { displayNumber: 'asc' },
    select: {
      chatId: true,
      displayNumber: true,
      name: true,
      archiveEnabled: true,
      agentChatEnabled: true,
    },
  })
}

function buildAssistantMessage(preview: AssistantPreview): string {
  const names = preview.targets
    .map((t) => formatChatListLabel(t.displayNumber, t.name))
    .join(', ')
  const warnings = preview.warnings.length ? ` Avisos: ${preview.warnings.join(' ')}` : ''
  if (preview.targets.length > 1) {
    return `Vou enviar "${preview.text}" para ${preview.targets.length} chats (${names}). Confirma?${warnings}`
  }
  return `Vou enviar "${preview.text}" para ${names}. Confirma?${warnings}`
}

async function parseWithLlm(
  message: string,
  history: AssistantHistoryEntry[] | undefined,
): Promise<AssistantCommand> {
  const provider = await getUnifiedProvider('assistant')
  if (!provider) {
    throw new Error('Configure um provedor de IA em Configurações para usar o Chat IA.')
  }

  const result = await provider.chatCompletion({
    system: [
      'Você classifica pedidos do operador do WhatsApp Assistant.',
      'Responda APENAS JSON válido com uma das ações:',
      '{ "action":"query", "question":"...", "sources":["reports"|"messages"|"both"] }',
      '{ "action":"send_message", "messageText":"..."|null, "composeInstruction":"..."|null, "targets":[...], "requiresConfirmation":true }',
      '{ "action":"clarify", "question":"..." }',
      '{ "action":"refuse", "reason":"..." }',
      'targets: all_archive_enabled | all_agent_enabled | chat_ids | by_names',
    ].join('\n'),
    user: message,
    history,
  })

  try {
    const parsed = extractJsonFromText(result.text) as { action: string }
    if (
      parsed.action === 'query' ||
      parsed.action === 'send_message' ||
      parsed.action === 'clarify' ||
      parsed.action === 'refuse'
    ) {
      return parsed as AssistantCommand
    }
  } catch {
    // fallback below
  }

  return heuristicParse(message)
}

async function handleSendMessage(
  command: Extract<AssistantCommand, { action: 'send_message' }>,
  userMessage: string,
): Promise<AssistantChatResponse> {
  await ensureWhatsappReady()

  const chats = await loadChatConfigs()
  const resolver = new ResolveAssistantTargetsUseCase(chats)
  const resolved = resolver.execute(command.targets)
  if (!resolved.ok) {
    return { phase: 'answer', text: resolved.clarify }
  }

  const provider = await getUnifiedProvider('assistant')
  if (!provider) {
    return { phase: 'error', message: 'Configure um provedor de IA em Configurações.' }
  }

  const composer = new ComposeAssistantMessageUseCase({
    compose: async (instruction) => {
      const result = await provider.chatCompletion({
        system: 'Redija mensagens curtas e naturais para WhatsApp em português brasileiro. Sem markdown.',
        user: `Instrução: ${instruction}`,
      })
      return result.text.trim()
    },
  })

  let text: string
  try {
    text = await composer.execute({
      messageText: command.messageText,
      composeInstruction: command.composeInstruction,
    })
  } catch (error) {
    return {
      phase: 'error',
      message: error instanceof Error ? error.message : 'Não foi possível compor a mensagem.',
    }
  }

  const preview: AssistantPreview = {
    action: 'send_message',
    text,
    targets: resolved.targets,
    warnings: resolved.warnings,
    needsExtraConfirm: resolved.targets.length > 20,
  }

  const actionToken = createActionToken(preview, userMessage)
  return {
    phase: 'preview',
    actionToken,
    preview,
    assistantMessage: buildAssistantMessage(preview),
  }
}

export async function handleAssistantChat(input: {
  message: string
  history?: AssistantHistoryEntry[]
  confirmAction?: boolean
  actionToken?: string
  previewText?: string
  extraConfirm?: string
}): Promise<AssistantChatResponse> {
  const provider = await getUnifiedProvider('assistant')
  if (!provider) {
    return {
      phase: 'error',
      message: 'Configure um provedor de IA em Configurações para usar o Chat IA.',
    }
  }

  const chats = await loadChatConfigs()
  const actionLog = new AssistantActionLogPrismaRepository(prisma)

  if (input.confirmAction && input.actionToken) {
    await ensureWhatsappReady()
    const now = Date.now()
    if (now - lastSendAt < 30_000) {
      return { phase: 'error', message: 'Aguarde 30 segundos entre envios.' }
    }

    const stored = consumeActionToken(input.actionToken)
    if (!stored) {
      return { phase: 'error', message: 'Preview expirado ou já utilizado. Peça novamente.' }
    }

    const finalText = input.previewText?.trim() || stored.text
    if (stored.needsExtraConfirm && input.extraConfirm?.trim().toUpperCase() !== 'CONFIRMAR') {
      return {
        phase: 'error',
        message: 'Para enviar para mais de 20 chats, digite CONFIRMAR no campo de confirmação.',
      }
    }

    const { provider: whatsapp } = getWhatsappRuntime()
    const executor = new ExecuteAssistantCommandUseCase(
      {
        sendMessage: (msg) => whatsapp.sendMessage(msg),
        isConnected: () => whatsapp.getStatus().status === 'connected',
      },
      actionLog,
    )

    const result = await executor.execute({ text: finalText, targets: stored.targets })
    lastSendAt = now
    return { phase: 'done', sent: result.sent, chatIds: result.chatIds }
  }

  const heuristic = heuristicParse(input.message)
  let command: AssistantCommand
  if (heuristic.action === 'send_message') {
    command = heuristic
  } else {
    try {
      command = await parseWithLlm(input.message, input.history)
    } catch (error) {
      console.error('[assistant/chat] parse failed', error, { message: input.message })
      return {
        phase: 'error',
        message: error instanceof Error ? error.message : 'Não foi possível interpretar o pedido.',
      }
    }
  }

  if (command.action === 'refuse') {
    return { phase: 'answer', text: command.reason }
  }

  if (command.action === 'clarify') {
    return { phase: 'answer', text: command.question }
  }

  if (command.action === 'query') {
    const queryUseCase = new QueryAssistantKnowledgeUseCase(
      {
        loadReports: async (since) => {
          const reports = await prisma.conversationDailyReport.findMany({
            where: { reportDate: { gte: since } },
            orderBy: { reportDate: 'desc' },
            take: 40,
          })
          const configs = await loadChatConfigs()
          const byChat = new Map(configs.map((c) => [c.chatId, c]))
          return reports.map((report) => {
            const chat = byChat.get(report.chatId)
            return {
              chatId: report.chatId,
              displayNumber: chat?.displayNumber ?? 0,
              name: chat?.name ?? null,
              reportDate: report.reportDate,
              content: report.content,
            }
          })
        },
        loadMessages: async (since, chatIds) => {
          const enabled = chatIds.length
            ? chats.filter((c) => chatIds.includes(c.chatId) && c.archiveEnabled)
            : chats.filter((c) => c.archiveEnabled)
          const enabledIds = enabled.map((c) => c.chatId)
          if (!enabledIds.length) return []
          const messages = await prisma.whatsappMessage.findMany({
            where: {
              chatId: { in: enabledIds },
              receivedAt: { gte: since },
              content: { not: '' },
            },
            orderBy: { receivedAt: 'desc' },
            take: 200,
            select: {
              chatId: true,
              content: true,
              receivedAt: true,
              fromMe: true,
              messageType: true,
            },
          })
          const byChat = new Map(enabled.map((c) => [c.chatId, c]))
          return messages.map((msg) => {
            const chat = byChat.get(msg.chatId)
            return {
              chatId: msg.chatId,
              displayNumber: chat?.displayNumber ?? 0,
              name: chat?.name ?? null,
              content: msg.content,
              receivedAt: msg.receivedAt,
              fromMe: msg.fromMe,
              messageType: msg.messageType,
            }
          })
        },
      },
      {
        answer: async ({ question, context, history }) => {
          const result = await provider.chatCompletion({
            system: [
              'Você é o assistente do WhatsApp Assistant.',
              'Responda usando APENAS o contexto fornecido (relatórios e mensagens).',
              'Cite fonte: relatório ou mensagem com data e chat.',
              context,
            ].join('\n\n'),
            user: question,
            history,
          })
          return result.text
        },
      },
    )

    const answer = await queryUseCase.execute({
      question: command.question,
      sources: command.sources,
      history: input.history,
    })
    return { phase: 'answer', text: answer }
  }

  return handleSendMessage(command, input.message)
}

export async function listRecentAssistantActions(limit = 10) {
  const repo = new AssistantActionLogPrismaRepository(prisma)
  return repo.listRecent(limit)
}
