import type { ID, PaymentMethod, Timestamped } from './common'

export type PaymentDirection = 'inbound' | 'outbound'

export interface Payment extends Timestamped {
  id: ID
  direction: PaymentDirection
  method: PaymentMethod
  amount: number
  date: string
  /** The Vendor Bill or Customer Invoice this payment is registered against. */
  targetType: 'vendor_bill' | 'customer_invoice'
  targetId: string
  journalEntryId?: string
}
