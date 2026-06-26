import { z } from 'zod'

export const RevenueCandidateSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
})

export type RevenueCandidate = z.infer<typeof RevenueCandidateSchema>
