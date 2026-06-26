import { z } from 'zod'

const NullableStringSchema = z.union([z.string().min(1), z.null()])
const CandidateTypeSchema = z.enum(['EXPENSE_CANDIDATE', 'REVENUE_CANDIDATE', 'UNKNOWN'])

export const ExtractionResultSchema = z
  .object({
    type: CandidateTypeSchema,
    confidence: z.number().min(0).max(1),
    data: z
      .object({
        description: z.string().min(1),
        amount: z.number().min(0),
        categorySuggestion: NullableStringSchema,
        supplierSuggestion: NullableStringSchema,
        date: z.union([z.string(), z.null()]),
        reason: NullableStringSchema,
        confidence: z.number().min(0).max(1),
      })
      .strict(),
    model: z.string().min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type === 'EXPENSE_CANDIDATE') {
      if (value.data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data', 'amount'],
          message: 'Expense amount must be greater than zero',
        })
      }
      if (value.data.reason !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data', 'reason'],
          message: 'Expense candidate reason must be null',
        })
      }
      return
    }

    if (value.type === 'REVENUE_CANDIDATE') {
      if (value.data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data', 'amount'],
          message: 'Revenue amount must be greater than zero',
        })
      }
      if (value.data.categorySuggestion !== null || value.data.supplierSuggestion !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data'],
          message: 'Revenue candidate cannot include categorySuggestion or supplierSuggestion',
        })
      }
      if (value.data.reason !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data', 'reason'],
          message: 'Revenue candidate reason must be null',
        })
      }
      return
    }

    if (
      !value.data.description ||
      value.data.amount !== 0 ||
      value.data.categorySuggestion !== null ||
      value.data.supplierSuggestion !== null ||
      value.data.date !== null ||
      !value.data.reason
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['data'],
        message: 'Unknown candidate must only carry a reason',
      })
    }
  })

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>
