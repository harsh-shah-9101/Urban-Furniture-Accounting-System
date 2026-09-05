import { z } from 'zod'

export const accountSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code is too long'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['asset', 'liability', 'income', 'expense', 'capital']),
})

export type AccountFormValues = z.infer<typeof accountSchema>
