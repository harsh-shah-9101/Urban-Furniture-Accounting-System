import { z } from 'zod'

export const paymentSchema = z.object({
  paymentType: z.enum(['send', 'receive']),
  partnerId: z.number().min(1, 'Select a partner'),
  method: z.enum(['cash', 'bank']),
  amount: z.number().positive('Must be greater than 0'),
  paymentDate: z.string().min(1, 'Date is required'),
  reference: z.string().optional().or(z.literal('')),
  note: z.string().optional().or(z.literal('')),
  vendorBillId: z.number().nullable(),
  customerInvoiceId: z.number().nullable(),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>
