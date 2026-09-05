export type PurchaseStatus = 'draft' | 'confirmed' | 'billed' | 'paid' | 'cancelled'

export interface PurchaseOrderLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface PurchaseOrder {
  id: number
  vendorId: number
  status: PurchaseStatus
  totalAmount: number
  notes: string | null
  lines: PurchaseOrderLine[]
}

export interface PurchaseOrderLineInput {
  productId: number
  quantity: number
  unitPrice: number
}

export interface PurchaseOrderInput {
  vendorId: number
  notes?: string | null
  lines: PurchaseOrderLineInput[]
}

export type BillStatus = 'draft' | 'posted' | 'paid' | 'cancelled'

export interface VendorBillLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface VendorBill {
  id: number
  purchaseOrderId: number
  vendorId: number
  status: BillStatus
  totalAmount: number
  lines: VendorBillLine[]
}

export type BillPaymentMethod = 'cash' | 'bank'

export interface BillPaymentInput {
  method: BillPaymentMethod
  amount?: number | null
  reference?: string | null
}

export interface BillPayment {
  id: number
  vendorBillId: number
  amount: number
  method: BillPaymentMethod
  reference: string | null
}
