import { z } from 'zod'

export const analyticAccountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['income', 'expense']),
})

export type AnalyticAccountFormValues = z.infer<typeof analyticAccountSchema>
