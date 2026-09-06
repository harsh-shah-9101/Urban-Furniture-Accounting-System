import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { waitForMockPayment } from './mock-payment'
import { markInvoicePaidLocally } from './mock-payment-store'
import { paymentsApi } from './api'
import { paymentKeys } from './query-keys'
import { portalInvoiceKeys } from '@/features/customer-portal/query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { PaymentInput, PaymentUpdateInput } from '@/types/payments'

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
