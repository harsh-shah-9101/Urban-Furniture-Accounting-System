export type SalesOrderStatus = 'draft' | 'confirmed' | 'invoiced' | 'paid' | 'cancelled'

export interface SalesOrderLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface SalesOrder {
  id: number
  customerId: number
  status: SalesOrderStatus
  totalAmount: number
  notes: string | null
  lines: SalesOrderLine[]
}

export interface SalesOrderLineInput {
  productId: number
  quantity: number
  unitPrice: number
}

export interface SalesOrderInput {
  customerId: number
  notes?: string | null
  lines: SalesOrderLineInput[]
}

export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'cancelled'

export interface CustomerInvoiceLine {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface CustomerInvoice {
  id: number
  salesOrderId: number
  customerId: number
  status: InvoiceStatus
  totalAmount: number
  lines: CustomerInvoiceLine[]
}

export type CustomerPaymentMethod = 'cash' | 'bank'

export interface CustomerPaymentInput {
  method: CustomerPaymentMethod
  amount?: number | null
  reference?: string | null
}

export interface CustomerPayment {
  id: number
  customerInvoiceId: number
  amount: number
  method: CustomerPaymentMethod
  reference: string | null
}
