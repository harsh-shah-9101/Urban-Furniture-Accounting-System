import type { DocumentPaymentInput, Payment } from './payments'

export type SalesOrderStatus = 'draft' | 'confirmed' | 'invoiced' | 'paid' | 'cancelled'

export interface SalesOrderLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
  analyticAccountId: number | null
  accountId: number | null
}

export interface SalesOrder {
  id: number
  soNumber: string | null
  customerId: number
  orderDate: string
  status: SalesOrderStatus
  totalAmount: number
  notes: string | null
  lines: SalesOrderLine[]
}

export interface SalesOrderLineInput {
  productId: number
  quantity: number
  unitPrice: number
  analyticAccountId?: number | null
  accountId?: number | null
}

export interface SalesOrderInput {
  customerId: number
  orderDate?: string | null
  notes?: string | null
  lines: SalesOrderLineInput[]
}

export type InvoiceStatus = 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled'

export interface CustomerInvoiceLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
  analyticAccountId: number | null
  accountId: number | null
}

export interface CustomerInvoice {
  id: number
  invoiceNumber: string | null
  salesOrderId: number
  customerId: number
  invoiceDate: string
  dueDate: string | null
  status: InvoiceStatus
  totalAmount: number
  amountPaid: number
  amountDue: number
  paidByCash: number
  paidByBank: number
  journalEntryId: number | null
  lines: CustomerInvoiceLine[]
  payments: Payment[]
}

export type CustomerPaymentInput = DocumentPaymentInput
