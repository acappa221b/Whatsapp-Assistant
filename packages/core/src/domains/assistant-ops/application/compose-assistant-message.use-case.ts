export type MessageComposerPort = {
  compose(instruction: string): Promise<string>
}

export class ComposeAssistantMessageUseCase {
  constructor(private readonly composer: MessageComposerPort) {}

  async execute(input: {
    messageText: string | null
    composeInstruction: string | null
  }): Promise<string> {
    if (input.messageText?.trim()) return input.messageText.trim()
    if (!input.composeInstruction?.trim()) {
      throw new Error('Message text or compose instruction is required')
    }
    return this.composer.compose(input.composeInstruction.trim())
  }
}
