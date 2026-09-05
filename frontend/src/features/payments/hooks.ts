import { useMutation, useQueryClient } from '@tanstack/react-query'
import { waitForMockPayment } from './mock-payment'
import { markInvoicePaidLocally } from './mock-payment-store'
import { portalInvoiceKeys } from '@/features/customer-portal/query-keys'

/**
 * See mock-payment.ts for why this simulates rather than calls a real gateway. It never
 * touches the backend, so the invoice's real status is unchanged there — but it marks the
 * invoice paid locally (mock-payment-store.ts) and refetches the portal queries so the
 * customer sees their own status badge flip to Paid right away instead of waiting on data
 * the backend will never actually send.
 */
export function useSimulateInvoicePayment(invoiceId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => waitForMockPayment(),
    onSuccess: () => {
      markInvoicePaidLocally(invoiceId)
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.lists() })
    },
  })
}
