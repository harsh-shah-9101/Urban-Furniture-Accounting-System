import type { DocumentPaymentInput, Payment } from './payments'

export type PurchaseStatus = 'draft' | 'confirmed' | 'billed' | 'paid' | 'cancelled'

export interface PurchaseOrderLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
  analyticAccountId: number | null
  accountId: number | null
}

export interface PurchaseOrder {
  id: number
  poNumber: string | null
  vendorId: number
  orderDate: string
  status: PurchaseStatus
  totalAmount: number
  notes: string | null
  lines: PurchaseOrderLine[]
}

export interface PurchaseOrderLineInput {
  productId: number
  quantity: number
  unitPrice: number
  analyticAccountId?: number | null
  accountId?: number | null
}

export interface PurchaseOrderInput {
  vendorId: number
  orderDate?: string | null
  notes?: string | null
  lines: PurchaseOrderLineInput[]
}

export type BillStatus = 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled'

export interface VendorBillLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
  analyticAccountId: number | null
  accountId: number | null
}

export interface VendorBill {
  id: number
  billNumber: string | null
  billReference: string | null
  purchaseOrderId: number
  vendorId: number
  billDate: string
  dueDate: string | null
  status: BillStatus
  totalAmount: number
  amountPaid: number
  amountDue: number
  paidByCash: number
  paidByBank: number
  journalEntryId: number | null
  lines: VendorBillLine[]
  payments: Payment[]
}

export interface VendorBillDatesInput {
  billReference?: string | null
  billDate?: string | null
  dueDate?: string | null
}

export type BillPaymentInput = DocumentPaymentInput
