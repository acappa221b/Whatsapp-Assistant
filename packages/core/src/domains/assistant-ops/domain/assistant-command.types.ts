export type AssistantTarget =
  | { type: 'all_archive_enabled' }
  | { type: 'all_agent_enabled' }
  | { type: 'chat_ids'; chatIds: string[] }
  | { type: 'by_names'; nameQueries: string[] }

export type AssistantCommand =
  | {
      action: 'query'
      question: string
      sources: ('reports' | 'messages' | 'both')[]
    }
  | {
      action: 'send_message'
      messageText: string | null
      composeInstruction: string | null
      targets: AssistantTarget[]
      requiresConfirmation: true
    }
  | {
      action: 'clarify'
      question: string
    }
  | {
      action: 'refuse'
      reason: string
    }

export type ResolvedTarget = {
  chatId: string
  displayNumber: number
  name: string | null
  archiveEnabled: boolean
}

export type AssistantPreview = {
  action: 'send_message'
  text: string
  targets: ResolvedTarget[]
  warnings: string[]
  needsExtraConfirm: boolean
}
