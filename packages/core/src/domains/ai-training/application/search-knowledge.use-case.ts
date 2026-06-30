import type { AiKnowledgeDocument } from '../domain/ai-persona'

export type SearchKnowledgeInput = {
  query: string
  limit?: number
}

export type SearchKnowledgeResult = {
  contextText: string
  matchedDocuments: Array<{ id: string; title: string; score: number }>
}

const MAX_CONTEXT_CHARS = 16_000

function extractSearchableText(doc: AiKnowledgeDocument): string {
  const content = doc.parsedContent
  if (!content || typeof content !== 'object') return doc.title

  const parsed = content as {
    chunks?: string[]
    rows?: Array<Record<string, string>>
    text?: string
  }

  if (Array.isArray(parsed.chunks)) {
    return parsed.chunks.join('\n')
  }
  if (Array.isArray(parsed.rows)) {
    return parsed.rows
      .map((row) => Object.values(row).filter(Boolean).join(' | '))
      .join('\n')
  }
  if (typeof parsed.text === 'string') return parsed.text
  return doc.title
}

function scoreDocument(query: string, text: string, title: string): number {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
  if (tokens.length === 0) return 0

  const haystack = `${title}\n${text}`.toLowerCase()
  let score = 0
  for (const token of tokens) {
    if (haystack.includes(token)) score += 1
  }
  return score
}

export class SearchKnowledgeUseCase {
  constructor(
    private readonly listReady: () => Promise<AiKnowledgeDocument[]>,
  ) {}

  async execute(input: SearchKnowledgeInput): Promise<SearchKnowledgeResult> {
    const docs = await this.listReady()
    const limit = input.limit ?? 3
    const ranked = docs
      .map((doc) => {
        const text = extractSearchableText(doc)
        return {
          doc,
          text,
          score: scoreDocument(input.query, text, doc.title),
        }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    const selected = ranked.length > 0 ? ranked : docs.slice(0, limit).map((doc) => ({
      doc,
      text: extractSearchableText(doc),
      score: 0,
    }))

    let contextText = ''
    for (const entry of selected) {
      const block = `## ${entry.doc.title}\n${entry.text}\n`
      if (contextText.length + block.length > MAX_CONTEXT_CHARS) break
      contextText += block
    }

    return {
      contextText: contextText.trim(),
      matchedDocuments: selected.map((entry) => ({
        id: entry.doc.id,
        title: entry.doc.title,
        score: entry.score,
      })),
    }
  }
}
