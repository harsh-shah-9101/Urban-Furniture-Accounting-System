import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type {
  CustomerInvoice,
  CustomerInvoiceLine,
  CustomerPayment,
  CustomerPaymentInput,
  SalesOrder,
  SalesOrderInput,
  SalesOrderLine,
} from '@/types/sales'

interface LineDto {
  id: number
  product_id: number
  quantity: number
  unit_price: string
  line_total: string
}

interface SalesOrderDto {
  id: number
  customer_id: number
  status: SalesOrder['status']
  total_amount: string
  notes: string | null
  lines: LineDto[]
}

export interface CustomerInvoiceDto {
  id: number
  sales_order_id: number
  customer_id: number
  status: CustomerInvoice['status']
  total_amount: string
  lines: LineDto[]
}

interface CustomerPaymentDto {
  id: number
  customer_invoice_id: number
  amount: string
  method: CustomerPayment['method']
  reference: string | null
}

function fromLineDto(dto: LineDto): SalesOrderLine | CustomerInvoiceLine {
  return {
    id: dto.id,
    productId: dto.product_id,
    quantity: dto.quantity,
    unitPrice: Number(dto.unit_price),
    lineTotal: Number(dto.line_total),
  }
}

function fromSalesOrderDto(dto: SalesOrderDto): SalesOrder {
  return {
    id: dto.id,
    customerId: dto.customer_id,
    status: dto.status,
    totalAmount: Number(dto.total_amount),
    notes: dto.notes,
    lines: dto.lines.map(fromLineDto),
  }
}

export function fromCustomerInvoiceDto(dto: CustomerInvoiceDto): CustomerInvoice {
  return {
    id: dto.id,
    salesOrderId: dto.sales_order_id,
    customerId: dto.customer_id,
    status: dto.status,
    totalAmount: Number(dto.total_amount),
    lines: dto.lines.map(fromLineDto),
  }
}

function fromPaymentDto(dto: CustomerPaymentDto): CustomerPayment {
  return {
    id: dto.id,
    customerInvoiceId: dto.customer_invoice_id,
    amount: Number(dto.amount),
    method: dto.method,
    reference: dto.reference,
  }
}

function toCreateDto(input: SalesOrderInput) {
  return {
    customer_id: input.customerId,
    notes: input.notes || null,
    lines: input.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
    })),
  }
}

function toPaymentDto(input: CustomerPaymentInput) {
  return {
    method: input.method,
    amount: input.amount ?? null,
    reference: input.reference || null,
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
  pay: async (id: number, input: CustomerPaymentInput, role?: BackendUserRole) => {
    const dto = await apiPost<CustomerPaymentDto>(`/customer-invoices/${id}/pay`, toPaymentDto(input), roleHeaders(role))
    return fromPaymentDto(dto)
  },
}
