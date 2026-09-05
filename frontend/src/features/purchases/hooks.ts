import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { purchaseOrdersApi, vendorBillsApi } from './api'
import { purchaseOrderKeys, vendorBillKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { BillPaymentInput, PurchaseOrderInput } from '@/types/purchases'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function usePurchaseOrders() {
  const role = useRole()
  return useQuery({ queryKey: purchaseOrderKeys.lists(), queryFn: () => purchaseOrdersApi.list(role) })
}

export function usePurchaseOrder(id: number) {
  const role = useRole()
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => purchaseOrdersApi.get(id, role),
    enabled: Number.isFinite(id),
  })
}

export function useCreatePurchaseOrder() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PurchaseOrderInput) => purchaseOrdersApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      toast.success('Purchase order created')
    },
  })
}

export function useConfirmPurchaseOrder(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => purchaseOrdersApi.confirm(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) })
      toast.success('Purchase order confirmed')
    },
  })
}

export function useCreateBillFromPurchaseOrder(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => purchaseOrdersApi.createBill(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: vendorBillKeys.lists() })
      toast.success('Vendor bill created')
    },
  })
}

export function useVendorBills() {
  const role = useRole()
  return useQuery({ queryKey: vendorBillKeys.lists(), queryFn: () => vendorBillsApi.list(role) })
}

export function useVendorBill(id: number) {
  const role = useRole()
  return useQuery({
    queryKey: vendorBillKeys.detail(id),
    queryFn: () => vendorBillsApi.get(id, role),
    enabled: Number.isFinite(id),
  })
}

export function usePostVendorBill(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => vendorBillsApi.post(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorBillKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendorBillKeys.detail(id) })
      toast.success('Vendor bill posted')
    },
  })
}

export function usePayVendorBill(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BillPaymentInput) => vendorBillsApi.pay(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorBillKeys.lists() })
      queryClient.invalidateQueries({ queryKey: vendorBillKeys.detail(id) })
      toast.success('Payment registered')
    },
  })
}
