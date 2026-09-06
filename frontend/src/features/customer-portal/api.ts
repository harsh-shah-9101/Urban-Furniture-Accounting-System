import { apiGet, apiPost, portalHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { CustomerInvoice, CustomerPaymentInput } from '@/types/sales'
import { fromCustomerInvoiceDto, toPaymentDto, type CustomerInvoiceDto } from '@/features/sales/api'

/** Response shape of POST /customer-portal/invoices/:id/pay — narrower than the staff
 *  /customer-invoices/:id/pay endpoint's PaymentDto, so it gets its own conversion rather
 *  than reusing fromPaymentDto (which would leave paymentDate/status/etc. undefined). */
interface CustomerPortalPaymentDto {
  id: number
  customer_invoice_id: number
  amount: string
  method: 'cash' | 'bank'
  reference: string | null
}

export const customerPortalApi = {
  listInvoices: async (role?: BackendUserRole, email?: string) => {
    const dtos = await apiGet<CustomerInvoiceDto[]>('/customer-portal/invoices', portalHeaders(role, email))
    return dtos.map(fromCustomerInvoiceDto)
  },
  getInvoice: async (id: number, role?: BackendUserRole, email?: string): Promise<CustomerInvoice> => {
    const dto = await apiGet<CustomerInvoiceDto>(`/customer-portal/invoices/${id}`, portalHeaders(role, email))
    return fromCustomerInvoiceDto(dto)
  },
  /**
   * Records a real payment against the customer's own invoice. Requires the backend's
   * contact-scoped route (verifying the invoice belongs to the calling customer) — see
   * mock-payment.ts for why the portal previously had no way to do this for real.
   */
  payInvoice: async (
    id: number,
    input: CustomerPaymentInput,
    role?: BackendUserRole,
    email?: string,
  ): Promise<void> => {
    await apiPost<CustomerPortalPaymentDto>(
      `/customer-portal/invoices/${id}/pay`,
      toPaymentDto(input),
      portalHeaders(role, email),
    )
  },
}
