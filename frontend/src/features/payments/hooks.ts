import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { waitForMockPayment } from './mock-payment'
import { markInvoicePaidLocally } from './mock-payment-store'
import { paymentsApi } from './api'
import { paymentKeys } from './query-keys'
import { customerPortalApi } from '@/features/customer-portal/api'
import { portalInvoiceKeys } from '@/features/customer-portal/query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { PaymentInput, PaymentUpdateInput } from '@/types/payments'

/**
 * See mock-payment.ts for why the "scan to pay" step simulates rather than calls a real
 * gateway. Once that simulated wait completes, this records a REAL payment against the
 * invoice via the customer-portal's own pay route, so admin's Customer Invoices list and the
 * customer's own Payment History both reflect it.
 *
 * The backend route currently creates the Payment (and journal entry) but doesn't update the
 * invoice's own status/amount_paid/amount_due — so even a successful call leaves the invoice
 * looking "Posted" everywhere until that's fixed server-side. The local flag below is always
 * set (not just on failure) purely so the customer's own "My Invoices & Bills" list still
 * shows Paid immediately in this browser; it can be dropped once the backend applies the
 * payment to the invoice itself. It's also still the fallback for when the call fails outright
 * (e.g. the route isn't deployed in some environment).
 */
export function useSimulateInvoicePayment(invoiceId: number, amount: number, reference: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined

  return useMutation({
    mutationFn: async () => {
      await waitForMockPayment()
      try {
        await customerPortalApi.payInvoice(
          invoiceId,
          { method: 'bank', amount, reference, note: 'Paid via customer portal (UPI, simulated gateway)' },
          role,
          user?.email,
        )
      } catch (error) {
        console.error('Portal payment was not recorded on the backend.', error)
      }
      markInvoicePaidLocally(invoiceId, amount, reference)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.lists() })
    },
  })
}

// --- Staff-facing Payments module (the /payments list + record-payment form) ---
// Unrelated to the customer-portal mock simulation above; these call the real backend.

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function usePayments() {
  const role = useRole()
  return useQuery({ queryKey: paymentKeys.lists(), queryFn: () => paymentsApi.list(role) })
}

export function usePayment(id: number) {
  const role = useRole()
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => paymentsApi.get(id, role),
    enabled: Number.isFinite(id),
  })
}

export function useCreatePayment() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PaymentInput) => paymentsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      toast.success('Payment created')
    },
  })
}

export function useUpdatePayment(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PaymentUpdateInput) => paymentsApi.update(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(id) })
      toast.success('Payment updated')
    },
  })
}

export function useConfirmPayment(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => paymentsApi.confirm(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(id) })
      toast.success('Payment confirmed')
    },
  })
}

export function useCancelPayment(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => paymentsApi.cancel(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(id) })
      toast.success('Payment cancelled')
    },
  })
}

export function useResetPaymentToDraft(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => paymentsApi.resetToDraft(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(id) })
      toast.success('Payment reset to draft')
    },
  })
}
