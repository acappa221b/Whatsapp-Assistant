export type AiPersonaProfile = {
  id: string
  usageMode: 'personal' | 'business'
  presetId: string
  toneFormal: number
  responseLength: number
  useEmojis: boolean
  customInstructions: string
  exampleReplies: string[]
  behaviorFlags: Record<string, boolean>
  salesPlaybook: string
  learnFromHistory: boolean
  historySampleLimit: number
}

export type AiKnowledgeDocument = {
  id: string
  title: string
  type: 'text' | 'excel' | 'csv' | 'image'
  status: 'processing' | 'ready' | 'error'
  storagePath: string
  useInAgent: boolean
  parsedContent: unknown
  errorMessage: string | null
}
