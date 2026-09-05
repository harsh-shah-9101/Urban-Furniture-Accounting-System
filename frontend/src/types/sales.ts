import type { ID, Timestamped } from './common'
import type { LineItem } from './purchases'

export type SalesOrderStatus = 'draft' | 'confirmed' | 'invoiced' | 'cancelled'

export interface SalesOrder extends Timestamped {
  id: ID
  customerId: string
  lines: LineItem[]
  taxRate: number
  status: SalesOrderStatus
  invoiceId?: string
}

export type SalesOrderInput = Pick<SalesOrder, 'customerId' | 'lines' | 'taxRate'>

export type CustomerInvoiceStatus = 'draft' | 'posted' | 'partially_paid' | 'paid'

export interface CustomerInvoice extends Timestamped {
  id: ID
  soId?: string
  customerId: string
  lines: LineItem[]
  taxRate: number
  invoiceDate: string
  dueDate: string
  status: CustomerInvoiceStatus
  amountPaid: number
  journalEntryId?: string
}
