export type AgentReplyDecisionAction = 'sent' | 'skip' | 'defer' | 'error'

export type AgentReplyDecision = {
  chatId: string
  action: AgentReplyDecisionAction
  reason?: string
  at: string
}

const BUFFER_SIZE = 20
const decisions: AgentReplyDecision[] = []

export function recordAgentReplyDecision(
  input: Omit<AgentReplyDecision, 'at'> & { at?: string },
): void {
  decisions.unshift({
    ...input,
    at: input.at ?? new Date().toISOString(),
  })
  if (decisions.length > BUFFER_SIZE) {
    decisions.length = BUFFER_SIZE
  }
}

export function getAgentReplyDiagnostics(): {
  lastDecision: AgentReplyDecision | null
  recentDecisions: AgentReplyDecision[]
} {
  return {
    lastDecision: decisions[0] ?? null,
    recentDecisions: [...decisions],
  }
}

export function resetAgentReplyDiagnostics(): void {
  decisions.length = 0
}
