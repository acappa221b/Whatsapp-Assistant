import { describe, expect, it } from 'vitest'
import { ComposeAgentPromptUseCase } from '../application/compose-agent-prompt.use-case'
import type { AiPersonaProfile } from '../domain/ai-persona'

function basePersona(overrides: Partial<AiPersonaProfile> = {}): AiPersonaProfile {
  return {
    id: 'default',
    usageMode: 'personal',
    presetId: 'casual',
    toneFormal: 30,
    responseLength: 40,
    useEmojis: true,
    customInstructions: '',
    exampleReplies: [],
    behaviorFlags: {},
    salesPlaybook: '',
    learnFromHistory: true,
    historySampleLimit: 20,
    ...overrides,
  }
}

describe('ComposeAgentPromptUseCase', () => {
  const useCase = new ComposeAgentPromptUseCase()

  it('includes personal identity by default', () => {
    const prompt = useCase.execute({
      persona: basePersona(),
      knowledgeContext: '',
      ownerStyleSamples: [],
      usageContext: 'whatsapp_auto_reply',
    })
    expect(prompt).toContain('pessoal')
    expect(prompt).not.toContain('PLAYBOOK DE VENDAS')
  })

  it('includes business company name and sales playbook', () => {
    const prompt = useCase.execute({
      persona: basePersona({
        usageMode: 'business',
        salesPlaybook: 'Vendemos consultoria mensal.',
      }),
      knowledgeContext: 'Plano Pro | R$ 99',
      ownerStyleSamples: ['opa, blz'],
      usageContext: 'whatsapp_auto_reply',
      companyName: 'Acme Ltda',
    })
    expect(prompt).toContain('Acme Ltda')
    expect(prompt).toContain('PLAYBOOK DE VENDAS')
    expect(prompt).toContain('FATOS')
    expect(prompt).toContain('opa, blz')
  })
})
