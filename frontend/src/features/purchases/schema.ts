import { z } from 'zod'

export const purchaseOrderLineSchema = z.object({
  productId: z.number().min(1, 'Select a product'),
  quantity: z.number().int('Must be a whole number').positive('Must be greater than 0'),
  unitPrice: z.number().min(0, 'Must be 0 or more'),
})

export const purchaseOrderSchema = z.object({
  vendorId: z.number().min(1, 'Select a vendor'),
  notes: z.string().optional().or(z.literal('')),
  lines: z.array(purchaseOrderLineSchema).min(1, 'Add at least one line'),
})

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>

export const billPaymentSchema = z.object({
  method: z.enum(['cash', 'bank']),
  amount: z.number().min(0, 'Must be 0 or more').optional(),
  reference: z.string().optional().or(z.literal('')),
})

export type BillPaymentFormValues = z.infer<typeof billPaymentSchema>
