import { useQuery } from '@tanstack/react-query'
import { customerPortalApi } from './api'
import { portalInvoiceKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import { isInvoicePaidLocally } from '@/features/payments/mock-payment-store'
import type { CustomerInvoice } from '@/types/sales'

const POLL_INTERVAL_MS = 15_000

/** Overlays the mock-paid flag (see mock-payment-store.ts) onto whatever the backend returns. */
function withLocalPaidOverlay(invoice: CustomerInvoice): CustomerInvoice {
  return isInvoicePaidLocally(invoice.id) ? { ...invoice, status: 'paid' } : invoice
}

export function usePortalInvoices() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({
    queryKey: portalInvoiceKeys.lists(),
    queryFn: () => customerPortalApi.listInvoices(role, user?.email),
    enabled: !!user?.email,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    // The local-paid overlay reads localStorage, not `data` — structural sharing would
    // otherwise reuse the previous `select` output whenever the backend's response is
    // byte-for-byte the same as last time (which it always is here, since the backend
    // never learns about the mock payment), so a locally-marked invoice would never
    // actually flip to Paid until something else changed the response shape.
    structuralSharing: false,
    select: (invoices) => invoices.map(withLocalPaidOverlay),
  })
}

export function usePortalInvoice(id: number) {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({
    queryKey: portalInvoiceKeys.detail(id),
    queryFn: () => customerPortalApi.getInvoice(id, role, user?.email),
    enabled: !!user?.email && Number.isFinite(id),
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    structuralSharing: false, // see usePortalInvoices for why
    select: withLocalPaidOverlay,
  })
}
