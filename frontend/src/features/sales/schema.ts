import { z } from 'zod'

export const salesOrderLineSchema = z.object({
  productId: z.number().min(1, 'Select a product'),
  quantity: z.number().int('Must be a whole number').positive('Must be greater than 0'),
  unitPrice: z.number().min(0, 'Must be 0 or more'),
})

export const salesOrderSchema = z.object({
  customerId: z.number().min(1, 'Select a customer'),
  notes: z.string().optional().or(z.literal('')),
  lines: z.array(salesOrderLineSchema).min(1, 'Add at least one line'),
})

export type SalesOrderFormValues = z.infer<typeof salesOrderSchema>

export const customerPaymentSchema = z.object({
  method: z.enum(['cash', 'bank']),
  amount: z.number().min(0, 'Must be 0 or more').optional(),
  reference: z.string().optional().or(z.literal('')),
})

export type CustomerPaymentFormValues = z.infer<typeof customerPaymentSchema>
