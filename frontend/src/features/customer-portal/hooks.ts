import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { customerPortalApi } from './api'
import { portalInvoiceKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import { getLocalPaidPayments, isInvoicePaidLocally } from '@/features/payments/mock-payment-store'
import type { CustomerInvoice } from '@/types/sales'

export interface PortalPaymentRow {
  key: string
  paymentDate: string
  invoiceId: number
  invoiceNumber: string | null
  amount: number
  method: string
  reference: string | null
}

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

/**
 * Merges real backend-confirmed payments (embedded on each invoice) with invoices only
 * "paid" through the mock UPI flow (see mock-payment-store.ts), so the customer's payment
 * history reflects both without duplicating an invoice that eventually gets a real payment
 * recorded against it too.
 */
export function usePortalPaymentHistory() {
  const invoicesQuery = usePortalInvoices()

  const rows = useMemo<PortalPaymentRow[]>(() => {
    const invoices = invoicesQuery.data ?? []
    const rows: PortalPaymentRow[] = []

    for (const invoice of invoices) {
      for (const payment of invoice.payments) {
        if (payment.status !== 'confirmed') continue
        rows.push({
          key: `server-${payment.id}`,
          paymentDate: payment.paymentDate,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: payment.amount,
          method: payment.method === 'bank' ? 'Bank Transfer' : 'Cash',
          reference: payment.reference,
        })
      }
    }

    const invoicesById = new Map(invoices.map((invoice) => [invoice.id, invoice]))
    for (const mock of getLocalPaidPayments()) {
      const invoice = invoicesById.get(mock.invoiceId)
      if (!invoice || invoice.payments.some((p) => p.status === 'confirmed')) continue
      rows.push({
        key: `mock-${mock.invoiceId}`,
        paymentDate: mock.paidAt,
        invoiceId: mock.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        amount: mock.amount,
        method: 'UPI',
        reference: mock.reference,
      })
    }

    return rows.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  }, [invoicesQuery.data])

  return { rows, isLoading: invoicesQuery.isLoading, isError: invoicesQuery.isError }
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
