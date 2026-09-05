import { apiGet, portalHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { CustomerInvoice } from '@/types/sales'
import { fromCustomerInvoiceDto, type CustomerInvoiceDto } from '@/features/sales/api'

export const customerPortalApi = {
  listInvoices: async (role?: BackendUserRole, email?: string) => {
    const dtos = await apiGet<CustomerInvoiceDto[]>('/customer-portal/invoices', portalHeaders(role, email))
    return dtos.map(fromCustomerInvoiceDto)
  },
  getInvoice: async (id: number, role?: BackendUserRole, email?: string): Promise<CustomerInvoice> => {
    const dto = await apiGet<CustomerInvoiceDto>(`/customer-portal/invoices/${id}`, portalHeaders(role, email))
    return fromCustomerInvoiceDto(dto)
  },
}
