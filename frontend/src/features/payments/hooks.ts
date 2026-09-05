import { useMutation } from '@tanstack/react-query'
import { waitForMockPayment } from './mock-payment'

/**
 * See mock-payment.ts for why this simulates rather than calls a real gateway. It never
 * touches the backend, so the invoice's real status is unchanged — the confirmation shown
 * here is a demo of the intended UX, not a record of an actual payment.
 */
export function useSimulateInvoicePayment() {
  return useMutation({
    mutationFn: () => waitForMockPayment(),
  })
}
