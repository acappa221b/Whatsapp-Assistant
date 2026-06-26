export function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[!.?,"']/g, '')
    .trim()
}

const STOPWORDS = new Set([
  'a',
  'o',
  'e',
  'de',
  'da',
  'do',
  'em',
  'um',
  'uma',
  'que',
  'pra',
  'para',
  'com',
  'no',
  'na',
  'eu',
  'tu',
  'vc',
  'você',
  'quando',
  'me',
  'te',
  'já',
  'ja',
])

export function significantWords(normalized: string): string[] {
  return normalized.split(' ').filter((w) => w.length > 1 && !STOPWORDS.has(w))
}

/** ≥70% overlap of significant words → redundant. */
export function isSemanticDuplicate(a: string, b: string): boolean {
  const wordsA = significantWords(normalizeForCompare(a))
  const wordsB = significantWords(normalizeForCompare(b))
  if (wordsA.length === 0 || wordsB.length === 0) return false
  const setB = new Set(wordsB)
  const shared = wordsA.filter((w) => setB.has(w)).length
  const ratio = shared / Math.min(wordsA.length, wordsB.length)
  return ratio >= 0.7
}
