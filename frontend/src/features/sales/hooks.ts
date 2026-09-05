import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { customerInvoicesApi, salesOrdersApi } from './api'
import { customerInvoiceKeys, salesOrderKeys } from './query-keys'
import { portalInvoiceKeys } from '@/features/customer-portal/query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { CustomerPaymentInput, SalesOrderInput } from '@/types/sales'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useSalesOrders() {
  const role = useRole()
  return useQuery({ queryKey: salesOrderKeys.lists(), queryFn: () => salesOrdersApi.list(role) })
}

export function useSalesOrder(id: number) {
  const role = useRole()
  return useQuery({
    queryKey: salesOrderKeys.detail(id),
    queryFn: () => salesOrdersApi.get(id, role),
    enabled: Number.isFinite(id),
  })
}

export function useCreateSalesOrder() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SalesOrderInput) => salesOrdersApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
      toast.success('Sales order created')
    },
  })
}

export function useConfirmSalesOrder(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => salesOrdersApi.confirm(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) })
      toast.success('Sales order confirmed')
    },
  })
}

export function useCreateInvoiceFromSalesOrder(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => salesOrdersApi.createInvoice(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.lists() })
      toast.success('Customer invoice created')
    },
  })
}

export function useCustomerInvoices() {
  const role = useRole()
  return useQuery({ queryKey: customerInvoiceKeys.lists(), queryFn: () => customerInvoicesApi.list(role) })
}

export function useCustomerInvoice(id: number) {
  const role = useRole()
  return useQuery({
    queryKey: customerInvoiceKeys.detail(id),
    queryFn: () => customerInvoicesApi.get(id, role),
    enabled: Number.isFinite(id),
  })
}

export function usePostCustomerInvoice(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => customerInvoicesApi.post(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.detail(id) })
      toast.success('Customer invoice posted')
    },
  })
}

export function usePayCustomerInvoice(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerPaymentInput) => customerInvoicesApi.pay(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: customerInvoiceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: portalInvoiceKeys.detail(id) })
      toast.success('Payment registered')
    },
  })
}
