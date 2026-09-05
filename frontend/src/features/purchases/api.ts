import { apiGet, apiPost, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type {
  BillPayment,
  BillPaymentInput,
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderLine,
  VendorBill,
  VendorBillLine,
} from '@/types/purchases'

interface LineDto {
  id: number
  product_id: number
  quantity: number
  unit_price: string
  line_total: string
}

interface PurchaseOrderDto {
  id: number
  vendor_id: number
  status: PurchaseOrder['status']
  total_amount: string
  notes: string | null
  lines: LineDto[]
}

interface VendorBillDto {
  id: number
  purchase_order_id: number
  vendor_id: number
  status: VendorBill['status']
  total_amount: string
  lines: LineDto[]
}

interface BillPaymentDto {
  id: number
  vendor_bill_id: number
  amount: string
  method: BillPayment['method']
  reference: string | null
}

function fromLineDto(dto: LineDto): PurchaseOrderLine | VendorBillLine {
  return {
    id: dto.id,
    productId: dto.product_id,
    quantity: dto.quantity,
    unitPrice: Number(dto.unit_price),
    lineTotal: Number(dto.line_total),
  }
}

function fromPurchaseOrderDto(dto: PurchaseOrderDto): PurchaseOrder {
  return {
    id: dto.id,
    vendorId: dto.vendor_id,
    status: dto.status,
    totalAmount: Number(dto.total_amount),
    notes: dto.notes,
    lines: dto.lines.map(fromLineDto),
  }
}

function fromVendorBillDto(dto: VendorBillDto): VendorBill {
  return {
    id: dto.id,
    purchaseOrderId: dto.purchase_order_id,
    vendorId: dto.vendor_id,
    status: dto.status,
    totalAmount: Number(dto.total_amount),
    lines: dto.lines.map(fromLineDto),
  }
}

function fromPaymentDto(dto: BillPaymentDto): BillPayment {
  return {
    id: dto.id,
    vendorBillId: dto.vendor_bill_id,
    amount: Number(dto.amount),
    method: dto.method,
    reference: dto.reference,
  }
}

function toCreateDto(input: PurchaseOrderInput) {
  return {
    vendor_id: input.vendorId,
    notes: input.notes || null,
    lines: input.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
      unit_price: line.unitPrice,
    })),
  }
}

function toPaymentDto(input: BillPaymentInput) {
  return {
    method: input.method,
    amount: input.amount ?? null,
    reference: input.reference || null,
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
  pay: async (id: number, input: BillPaymentInput, role?: BackendUserRole) => {
    const dto = await apiPost<BillPaymentDto>(`/vendor-bills/${id}/pay`, toPaymentDto(input), roleHeaders(role))
    return fromPaymentDto(dto)
  },
}
