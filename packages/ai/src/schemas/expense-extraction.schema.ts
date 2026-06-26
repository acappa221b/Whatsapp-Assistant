import { z } from 'zod'

export const ExpenseExtractionSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  confidence: z.number().min(0).max(1),
})

export type ExpenseExtraction = z.infer<typeof ExpenseExtractionSchema>
