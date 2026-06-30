import { describe, expect, it } from 'vitest'
import { SearchKnowledgeUseCase } from '../application/search-knowledge.use-case'
import type { AiKnowledgeDocument } from '../domain/ai-persona'

const docs: AiKnowledgeDocument[] = [
  {
    id: '1',
    title: 'Catalogo',
    type: 'excel',
    status: 'ready',
    storagePath: '/x',
    useInAgent: true,
    parsedContent: {
      rows: [{ produto: 'Plano Basico', plano: 'Mensal', preco: 'R$ 49', descricao: 'Basico' }],
      text: 'Plano Basico | Mensal | R$ 49',
    },
    errorMessage: null,
  },
  {
    id: '2',
    title: 'FAQ',
    type: 'text',
    status: 'ready',
    storagePath: '/y',
    useInAgent: true,
    parsedContent: { chunks: ['Horario de atendimento 9h-18h'], text: 'Horario de atendimento 9h-18h' },
    errorMessage: null,
  },
]

describe('SearchKnowledgeUseCase', () => {
  it('ranks documents by keyword match', async () => {
    const useCase = new SearchKnowledgeUseCase(async () => docs)
    const result = await useCase.execute({ query: 'quanto custa plano basico', limit: 2 })
    expect(result.matchedDocuments[0]?.id).toBe('1')
    expect(result.contextText).toContain('Plano Basico')
  })
})
