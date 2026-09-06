import { apiGet, apiPatch, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { Payment, PaymentInput, PaymentUpdateInput } from '@/types/payments'

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

function fromDto(dto: PaymentDto): Payment {
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

function toDto(input: PaymentInput) {
  return {
    payment_date: input.paymentDate || null,
    payment_type: input.paymentType,
    partner_id: input.partnerId,
    method: input.method,
    amount: input.amount,
    reference: input.reference || null,
    note: input.note || null,
    vendor_bill_id: input.vendorBillId ?? null,
    customer_invoice_id: input.customerInvoiceId ?? null,
  }
}

function toUpdateDto(input: PaymentUpdateInput) {
  return {
    ...(input.paymentDate !== undefined && { payment_date: input.paymentDate || null }),
    ...(input.paymentType !== undefined && { payment_type: input.paymentType }),
    ...(input.partnerId !== undefined && { partner_id: input.partnerId }),
    ...(input.method !== undefined && { method: input.method }),
    ...(input.amount !== undefined && { amount: input.amount }),
    ...(input.reference !== undefined && { reference: input.reference || null }),
    ...(input.note !== undefined && { note: input.note || null }),
    ...(input.vendorBillId !== undefined && { vendor_bill_id: input.vendorBillId }),
    ...(input.customerInvoiceId !== undefined && { customer_invoice_id: input.customerInvoiceId }),
  }
}

export const paymentsApi = {
  list: async (role?: BackendUserRole) => {
    const dtos = await apiGet<PaymentDto[]>('/payments', roleHeaders(role))
    return dtos.map(fromDto)
  },
  get: async (id: number, role?: BackendUserRole) => {
    const dto = await apiGet<PaymentDto>(`/payments/${id}`, roleHeaders(role))
    return fromDto(dto)
  },
  create: async (input: PaymentInput, role?: BackendUserRole) => {
    const dto = await apiPost<PaymentDto>('/payments', toDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  update: async (id: number, input: PaymentUpdateInput, role?: BackendUserRole) => {
    const dto = await apiPatch<PaymentDto>(`/payments/${id}`, toUpdateDto(input), roleHeaders(role))
    return fromDto(dto)
  },
  confirm: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<PaymentDto>(`/payments/${id}/confirm`, {}, roleHeaders(role))
    return fromDto(dto)
  },
  cancel: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<PaymentDto>(`/payments/${id}/cancel`, {}, roleHeaders(role))
    return fromDto(dto)
  },
  resetToDraft: async (id: number, role?: BackendUserRole) => {
    const dto = await apiPost<PaymentDto>(`/payments/${id}/reset-to-draft`, {}, roleHeaders(role))
    return fromDto(dto)
  },
}
