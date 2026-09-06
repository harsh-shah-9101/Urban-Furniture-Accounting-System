import { apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type {
  BillPaymentInput,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderLine,
  VendorBill,
  VendorBillDatesInput,
  VendorBillLine,
} from '@/types/purchases'
import type { Payment } from '@/types/payments'

interface LineDto {
  id: number
  product_id: number
  quantity: number
  unit_price: string
  line_total: string
  analytic_account_id: number | null
  account_id: number | null
}

interface PurchaseOrderDto {
  id: number
  po_number: string | null
  vendor_id: number
  order_date: string
  status: PurchaseOrder['status']
  total_amount: string
  notes: string | null
  lines: LineDto[]
}

interface VendorBillDto {
  id: number
  bill_number: string | null
  bill_reference: string | null
  purchase_order_id: number
  vendor_id: number
  bill_date: string
  due_date: string | null
  status: VendorBill['status']
  total_amount: string
  amount_paid: string
  amount_due: string
  paid_by_cash: string
  paid_by_bank: string
  journal_entry_id: number | null
  lines: LineDto[]
  payments: PaymentDto[]
}

interface PaymentDto {
  id: number
  payment_number: string | null
  payment_date: string
  payment_type: Payment['paymentType']
  partner_id: number | null
  method: Payment['method']
  amount: string
  reference: string | null
  note: string | null
  status: Payment['status']
  vendor_bill_id: number | null
  customer_invoice_id: number | null
  journal_entry_id: number | null
}

function fromLineDto(dto: LineDto): PurchaseOrderLine | VendorBillLine {
  return {
    id: dto.id,
    productId: dto.product_id,
    quantity: dto.quantity,
    unitPrice: Number(dto.unit_price),
    lineTotal: Number(dto.line_total),
    analyticAccountId: dto.analytic_account_id,
    accountId: dto.account_id,
  }
}

function fromPaymentDto(dto: PaymentDto): Payment {
  return {
    id: dto.id,
    paymentNumber: dto.payment_number,
    paymentDate: dto.payment_date,
    paymentType: dto.payment_type,
    partnerId: dto.partner_id,
    method: dto.method,
    amount: Number(dto.amount),
    reference: dto.reference,
    note: dto.note,
    status: dto.status,
    vendorBillId: dto.vendor_bill_id,
    customerInvoiceId: dto.customer_invoice_id,
    journalEntryId: dto.journal_entry_id,
  }
}

function fromPurchaseOrderDto(dto: PurchaseOrderDto): PurchaseOrder {
  return {
    id: dto.id,
    poNumber: dto.po_number,
    vendorId: dto.vendor_id,
    orderDate: dto.order_date,
    status: dto.status,
    totalAmount: Number(dto.total_amount),
    notes: dto.notes,
    lines: dto.lines.map(fromLineDto),
  }
}

function fromVendorBillDto(dto: VendorBillDto): VendorBill {
  return {
    id: dto.id,
    billNumber: dto.bill_number,
    billReference: dto.bill_reference,
    purchaseOrderId: dto.purchase_order_id,
    vendorId: dto.vendor_id,
    billDate: dto.bill_date,
    dueDate: dto.due_date,
    status: dto.status,
    totalAmount: Number(dto.total_amount),
    amountPaid: Number(dto.amount_paid),
    amountDue: Number(dto.amount_due),
    paidByCash: Number(dto.paid_by_cash),
    paidByBank: Number(dto.paid_by_bank),
    journalEntryId: dto.journal_entry_id,
    lines: dto.lines.map(fromLineDto),
    payments: (dto.payments ?? []).map(fromPaymentDto),
  }
}

function toCreateDto(input: PurchaseOrderInput) {
  return {
    vendor_id: input.vendorId,
    order_date: input.orderDate || null,
    notes: input.notes || null,
    lines: input.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      analytic_account_id: line.analyticAccountId ?? null,
      account_id: line.accountId ?? null,
    })),
  }
}

function toPaymentDto(input: BillPaymentInput) {
  return {
    method: input.method,
    amount: input.amount ?? null,
    reference: input.reference || null,
    note: input.note || null,
  }
}

function toDatesDto(input: VendorBillDatesInput) {
  return {
    ...(input.billReference !== undefined && { bill_reference: input.billReference || null }),
    ...(input.billDate !== undefined && { bill_date: input.billDate }),
    ...(input.dueDate !== undefined && { due_date: input.dueDate || null }),
  }
}

export const purchaseOrdersApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<PurchaseOrderDto[]>('/purchase-orders', roleHeaders(role))
    return dtos.map(fromPurchaseOrderDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<PurchaseOrderDto>(`/purchase-orders/${id}`, roleHeaders(role))
    return fromPurchaseOrderDto(dto)
  },
  create: async (input: PurchaseOrderInput, role?: BackendUserRole) => {
    const dto = await apiPost<PurchaseOrderDto>('/purchase-orders', toCreateDto(input), roleHeaders(role))
    return fromPurchaseOrderDto(dto)
  },
  confirm: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<PurchaseOrderDto>(`/purchase-orders/${id}/confirm`, {}, roleHeaders(role))
    return fromPurchaseOrderDto(dto)
  },
  cancel: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<PurchaseOrderDto>(`/purchase-orders/${id}/cancel`, {}, roleHeaders(role))
    return fromPurchaseOrderDto(dto)
  },
  createBill: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<VendorBillDto>(`/purchase-orders/${id}/create-bill`, {}, roleHeaders(role))
    return fromVendorBillDto(dto)
  },
}

export const vendorBillsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<VendorBillDto[]>('/vendor-bills', roleHeaders(role))
    return dtos.map(fromVendorBillDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<VendorBillDto>(`/vendor-bills/${id}`, roleHeaders(role))
    return fromVendorBillDto(dto)
  },
  post: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<VendorBillDto>(`/vendor-bills/${id}/post`, {}, roleHeaders(role))
    return fromVendorBillDto(dto)
  },
  cancel: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<VendorBillDto>(`/vendor-bills/${id}/cancel`, {}, roleHeaders(role))
    return fromVendorBillDto(dto)
  },
  pay: async (id: number, input: BillPaymentInput, role?: BackendUserRole) => {
    const dto = await apiPost<PaymentDto>(`/vendor-bills/${id}/pay`, toPaymentDto(input), roleHeaders(role))
    return fromPaymentDto(dto)
  },
  updateDates: async (id: number, input: VendorBillDatesInput, role?: BackendUserRole) => {
    const dto = await apiPatch<VendorBillDto>(`/vendor-bills/${id}/dates`, toDatesDto(input), roleHeaders(role))
    return fromVendorBillDto(dto)
  },
}
