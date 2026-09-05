import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['goods', 'service', 'combo']),
  salesPrice: z.number().min(0, 'Must be 0 or more'),
  cost: z.number().min(0, 'Must be 0 or more'),
  category: z.string().min(1, 'Category is required'),
})

export type ProductFormValues = z.infer<typeof productSchema>
