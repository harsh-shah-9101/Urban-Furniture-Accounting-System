import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type {
  CustomerInvoice,
  CustomerInvoiceLine,
  CustomerPaymentInput,
  SalesOrder,
  SalesOrderInput,
  SalesOrderLine,
} from '@/types/sales'
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

interface SalesOrderDto {
  id: number
  so_number: string | null
  customer_id: number
  order_date: string
  status: SalesOrder['status']
  total_amount: string
  notes: string | null
  lines: LineDto[]
}

export interface CustomerInvoiceDto {
  id: number
  invoice_number: string | null
  sales_order_id: number
  customer_id: number
  invoice_date: string
  due_date: string | null
  status: CustomerInvoice['status']
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

function fromLineDto(dto: LineDto): SalesOrderLine | CustomerInvoiceLine {
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

function fromSalesOrderDto(dto: SalesOrderDto): SalesOrder {
  return {
    id: dto.id,
    soNumber: dto.so_number,
    customerId: dto.customer_id,
    orderDate: dto.order_date,
    status: dto.status,
    totalAmount: Number(dto.total_amount),
    notes: dto.notes,
    lines: dto.lines.map(fromLineDto),
  }
}

export function fromCustomerInvoiceDto(dto: CustomerInvoiceDto): CustomerInvoice {
  return {
    id: dto.id,
    invoiceNumber: dto.invoice_number,
    salesOrderId: dto.sales_order_id,
    customerId: dto.customer_id,
    invoiceDate: dto.invoice_date,
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

function toCreateDto(input: SalesOrderInput) {
  return {
    customer_id: input.customerId,
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

function toPaymentDto(input: CustomerPaymentInput) {
  return {
    method: input.method,
    amount: input.amount ?? null,
    reference: input.reference || null,
    note: input.note || null,
  }
}

export const salesOrdersApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<SalesOrderDto[]>('/sales-orders', roleHeaders(role))
    return dtos.map(fromSalesOrderDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<SalesOrderDto>(`/sales-orders/${id}`, roleHeaders(role))
    return fromSalesOrderDto(dto)
  },
  create: async (input: SalesOrderInput, role?: BackendUserRole) => {
    const dto = await apiPost<SalesOrderDto>('/sales-orders', toCreateDto(input), roleHeaders(role))
    return fromSalesOrderDto(dto)
  },
  confirm: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<SalesOrderDto>(`/sales-orders/${id}/confirm`, {}, roleHeaders(role))
    return fromSalesOrderDto(dto)
  },
  cancel: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<SalesOrderDto>(`/sales-orders/${id}/cancel`, {}, roleHeaders(role))
    return fromSalesOrderDto(dto)
  },
  createInvoice: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<CustomerInvoiceDto>(`/sales-orders/${id}/create-invoice`, {}, roleHeaders(role))
    return fromCustomerInvoiceDto(dto)
  },
}

export const customerInvoicesApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<CustomerInvoiceDto[]>('/customer-invoices', roleHeaders(role))
    return dtos.map(fromCustomerInvoiceDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<CustomerInvoiceDto>(`/customer-invoices/${id}`, roleHeaders(role))
    return fromCustomerInvoiceDto(dto)
  },
  post: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<CustomerInvoiceDto>(`/customer-invoices/${id}/post`, {}, roleHeaders(role))
    return fromCustomerInvoiceDto(dto)
  },
  cancel: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<CustomerInvoiceDto>(`/customer-invoices/${id}/cancel`, {}, roleHeaders(role))
    return fromCustomerInvoiceDto(dto)
  },
  pay: async (id: number, input: CustomerPaymentInput, role?: BackendUserRole) => {
    const dto = await apiPost<PaymentDto>(`/customer-invoices/${id}/pay`, toPaymentDto(input), roleHeaders(role))
    return fromPaymentDto(dto)
  },
}
