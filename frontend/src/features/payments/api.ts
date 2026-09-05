import { apiPost, portalHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { RazorpayOrder, RazorpayVerifyInput } from '@/types/payments'

interface RazorpayOrderDto {
  key_id: string
  provider_order_id: string
  amount: string
  currency: string
}

function fromRazorpayOrderDto(dto: RazorpayOrderDto): RazorpayOrder {
  return {
    keyId: dto.key_id,
    providerOrderId: dto.provider_order_id,
    // Backend returns amount in rupees; Razorpay Checkout expects paise (smallest currency unit).
    amount: Math.round(Number(dto.amount) * 100),
    currency: dto.currency,
  }
}

function toVerifyDto(input: RazorpayVerifyInput) {
  return {
    razorpay_order_id: input.razorpayOrderId,
    razorpay_payment_id: input.razorpayPaymentId,
    razorpay_signature: input.razorpaySignature,
  }
}

export const razorpayApi = {
  createOrder: async (invoiceId: number, role?: BackendUserRole, email?: string) => {
    const dto = await apiPost<RazorpayOrderDto>(
      `/customer-invoices/${invoiceId}/razorpay-order`,
      {},
      portalHeaders(role, email),
    )
    return fromRazorpayOrderDto(dto)
  },
  verifyPayment: async (input: RazorpayVerifyInput, role?: BackendUserRole, email?: string) => {
    await apiPost<unknown>('/payments/razorpay/verify', toVerifyDto(input), portalHeaders(role, email))
  },
}
