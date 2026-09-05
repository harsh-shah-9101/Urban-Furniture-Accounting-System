import { z } from 'zod'

export const journalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['sales', 'purchase', 'bank', 'cash', 'general']),
  defaultDebitAccountId: z.number().nullable(),
  defaultCreditAccountId: z.number().nullable(),
})

export type JournalFormValues = z.infer<typeof journalSchema>
