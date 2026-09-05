import { z } from 'zod'

export const budgetSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    analyticAccountId: z.string().min(1, 'Analytic account is required'),
    periodStart: z.string().min(1, 'Period start is required'),
    periodEnd: z.string().min(1, 'Period end is required'),
    responsiblePerson: z.string().min(2, 'Responsible person is required'),
    plannedAmount: z.number().min(0, 'Must be 0 or more'),
  })
  .refine((data) => data.periodEnd >= data.periodStart, {
    message: 'Period end must be on or after period start',
    path: ['periodEnd'],
  })

export type BudgetFormValues = z.infer<typeof budgetSchema>
