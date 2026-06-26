import { z } from 'zod'

export const ExpenseCandidateSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  categorySuggestion: z.string().min(1).nullable().optional(),
  supplierSuggestion: z.string().min(1).nullable().optional(),
  date: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
})

export type ExpenseCandidate = z.infer<typeof ExpenseCandidateSchema>
