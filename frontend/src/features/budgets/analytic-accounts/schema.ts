import { z } from 'zod'

export const analyticAccountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code is too long'),
  type: z.enum(['income', 'expense'], { message: 'Type is required' }),
  description: z.string().optional().or(z.literal('')),
})

export type AnalyticAccountFormValues = z.infer<typeof analyticAccountSchema>
