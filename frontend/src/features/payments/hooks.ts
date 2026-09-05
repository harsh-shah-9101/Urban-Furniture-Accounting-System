import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { razorpayApi } from './api'
import { openRazorpayCheckout } from './razorpay-checkout'
import { customerInvoiceKeys } from '@/features/sales/query-keys'
import { portalInvoiceKeys } from '@/features/customer-portal/query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'

const PAYMENT_CANCELLED_MESSAGE = 'Payment cancelled.'

export function usePayInvoiceWithRazorpay(invoiceId: number) {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const order = await razorpayApi.createOrder(invoiceId, role, user?.email)

      const checkoutResponse = await openRazorpayCheckout({
        key: order.keyId,
        order_id: order.providerOrderId,
        amount: order.amount,
        currency: order.currency,
        name: 'Urban Furniture Accounting',
        description: `Payment for invoice #${invoiceId}`,
        prefill: { name: user?.name, email: user?.email },
      })

      await razorpayApi.verifyPayment(
        {
          razorpayOrderId: checkoutResponse.razorpay_order_id,
          razorpayPaymentId: checkoutResponse.razorpay_payment_id,
          razorpaySignature: checkoutResponse.razorpay_signature,
        },
        role,
        user?.email,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.detail(invoiceId) })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.detail(invoiceId) })
      toast.success('Payment successful')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Payment failed'
      if (message !== PAYMENT_CANCELLED_MESSAGE) toast.error(message)
    },
  })
}
