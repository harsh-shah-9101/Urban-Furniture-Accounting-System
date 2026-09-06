import { z } from 'zod'

export const budgetLineSchema = z.object({
  analyticAccountId: z.number({ message: 'Analytic account is required' }).min(1, 'Analytic account is required'),
  committedAmount: z.number().min(0, 'Must be 0 or more'),
})

export const budgetSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    responsibleContactId: z
      .number({ message: 'Responsible is required' })
      .min(1, 'Responsible is required'),
    lines: z.array(budgetLineSchema).min(1, 'Add at least one analytic account line'),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  })

export type BudgetLineFormValues = z.infer<typeof budgetLineSchema>
export type BudgetFormValues = z.infer<typeof budgetSchema>
