import { z } from 'zod'

export const budgetSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    analyticAccountId: z.number({ message: 'Analytic account is required' }).min(1, 'Analytic account is required'),
    budgetAmount: z.number().min(0, 'Must be 0 or more'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export type BudgetFormValues = z.infer<typeof budgetSchema>
