export type PersonaPresetId = 'casual' | 'professional' | 'sales' | 'support' | 'custom'

export type PersonaPreset = {
  toneFormal: number
  responseLength: number
  useEmojis: boolean
  customInstructions: string
  behaviorFlags: Record<string, boolean>
  salesPlaybook?: string
}

export const PERSONA_PRESETS: Record<Exclude<PersonaPresetId, 'custom'>, PersonaPreset> = {
  casual: {
    toneFormal: 20,
    responseLength: 30,
    useEmojis: true,
    customInstructions: 'Tom leve e proximo. Respostas curtas como WhatsApp entre amigos.',
    behaviorFlags: {
      proactiveOffers: false,
      useCatalog: false,
      deferWhenUncertain: true,
    },
  },
  professional: {
    toneFormal: 75,
    responseLength: 50,
    useEmojis: false,
    customInstructions: 'Tom profissional e claro. Sem girias excessivas.',
    behaviorFlags: {
      proactiveOffers: false,
      useCatalog: true,
      deferWhenUncertain: true,
    },
  },
  sales: {
    toneFormal: 55,
    responseLength: 55,
    useEmojis: true,
    customInstructions: 'Foco em ajudar o cliente a escolher e avancar na compra.',
    behaviorFlags: {
      proactiveOffers: true,
      useCatalog: true,
      deferWhenUncertain: true,
    },
    salesPlaybook:
      'Apresente beneficios, sugira proximo passo e use precos da base de conhecimento quando perguntarem.',
  },
  support: {
    toneFormal: 60,
    responseLength: 45,
    useEmojis: false,
    customInstructions: 'Priorize resolver duvidas com empatia e objetividade.',
    behaviorFlags: {
      proactiveOffers: false,
      useCatalog: true,
      deferWhenUncertain: true,
    },
  },
}
