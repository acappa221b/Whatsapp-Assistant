export type ExpenseCandidate = {
  description: string
  amount: number
  categorySuggestion?: string | null
  supplierSuggestion?: string | null
  date?: string | null
  confidence: number
}

export type RevenueCandidate = {
  description: string
  amount: number
  date?: string | null
  confidence: number
}

export type UnknownCandidate = {
  reason?: string | null
}

export type ExtractionCandidateData = ExpenseCandidate | RevenueCandidate | UnknownCandidate
