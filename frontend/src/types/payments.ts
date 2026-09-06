export type PaymentType = 'send' | 'receive'
export type PaymentMethod = 'cash' | 'bank'
export type PaymentStatus = 'draft' | 'confirmed' | 'cancelled'

export interface Payment {
  id: number
  paymentNumber: string | null
  paymentDate: string
  paymentType: PaymentType
  partnerId: number | null
  method: PaymentMethod
  amount: number
  reference: string | null
  note: string | null
  status: PaymentStatus
  vendorBillId: number | null
  customerInvoiceId: number | null
  journalEntryId: number | null
}

/** Full standalone payment create/update — used by the Payments module (POST /payments). */
export interface PaymentInput {
  paymentDate?: string | null
  paymentType: PaymentType
  partnerId: number
  method: PaymentMethod
  amount: number
  reference?: string | null
  note?: string | null
  vendorBillId?: number | null
  customerInvoiceId?: number | null
}

export type PaymentUpdateInput = Partial<PaymentInput>

/** Minimal payment shape accepted by /vendor-bills/:id/pay and /customer-invoices/:id/pay
 *  — the partner and payment type are inferred server-side from the bill/invoice. */
export interface DocumentPaymentInput {
  method: PaymentMethod
  amount?: number | null
  reference?: string | null
  note?: string | null
}
