import type { AiPersonaProfile } from '../domain/ai-persona'
import { AGENT_BEHAVIOR_RULES } from '@finance-ai/shared/ai-training'

export type ComposeAgentPromptInput = {
  persona: AiPersonaProfile
  knowledgeContext: string
  ownerStyleSamples: string[]
  usageContext: 'whatsapp_auto_reply' | 'assistant_chat' | 'report'
  companyName?: string
}

function toneLabel(value: number): string {
  if (value >= 70) return 'formal'
  if (value <= 30) return 'casual'
  return 'equilibrado'
}

function lengthLabel(value: number): string {
  if (value >= 70) return 'respostas mais completas'
  if (value <= 30) return 'respostas bem curtas'
  return 'respostas medias'
}

export class ComposeAgentPromptUseCase {
  execute(input: ComposeAgentPromptInput): string {
    const { persona } = input
    const identity =
      persona.usageMode === 'business' && input.companyName?.trim()
        ? `Voce responde WhatsApp em nome da empresa ${input.companyName.trim()}.`
        : 'Voce responde mensagens de WhatsApp em nome do usuario (dono da conta).'

    const personaBlock = [
      `Modo: ${persona.usageMode === 'business' ? 'empresa' : 'pessoal'}.`,
      `Preset: ${persona.presetId}.`,
      `Tom: ${toneLabel(persona.toneFormal)}.`,
      `Tamanho: ${lengthLabel(persona.responseLength)}.`,
      `Emojis: ${persona.useEmojis ? 'pode usar com moderacao' : 'evite emojis'}.`,
      persona.customInstructions.trim()
        ? `Instrucoes: ${persona.customInstructions.trim()}`
        : null,
      persona.exampleReplies.length
        ? `Exemplos de resposta desejada:\n${persona.exampleReplies.map((s) => `- ${s}`).join('\n')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n')

    const behaviorLines: string[] = []
    if (persona.behaviorFlags.proactiveOffers) {
      behaviorLines.push('- Pode sugerir produtos ou proximo passo quando fizer sentido.')
    }
    if (persona.behaviorFlags.deferWhenUncertain !== false) {
      behaviorLines.push('- Se nao souber, peca tempo em vez de inventar.')
    }
    if (persona.behaviorFlags.useCatalog) {
      behaviorLines.push('- Use a base de conhecimento para precos e produtos.')
    }

    const salesBlock =
      persona.usageMode === 'business' && persona.salesPlaybook.trim()
        ? `PLAYBOOK DE VENDAS:\n${persona.salesPlaybook.trim()}`
        : null

    const knowledgeBlock = input.knowledgeContext.trim()
      ? `FATOS — use apenas isto para precos/produtos:\n${input.knowledgeContext.trim()}`
      : 'FATOS: nenhum documento de catalogo carregado — nao invente precos.'

    const styleBlock =
      input.ownerStyleSamples.length > 0
        ? `Estilo do dono (imitar):\n${input.ownerStyleSamples.map((s) => `- ${s}`).join('\n')}`
        : 'Sem amostras do dono — use tom natural brasileiro.'

    const contextHint =
      input.usageContext === 'assistant_chat'
        ? 'Contexto: operador usando Chat IA interno (nao enviar ao WhatsApp diretamente).'
        : 'Contexto: resposta automatica no WhatsApp.'

    return [
      identity,
      personaBlock,
      'REGRAS DE COMPORTAMENTO:',
      AGENT_BEHAVIOR_RULES,
      behaviorLines.length ? behaviorLines.join('\n') : null,
      salesBlock,
      knowledgeBlock,
      styleBlock,
      contextHint,
    ]
      .filter(Boolean)
      .join('\n\n')
  }
}
