import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { analyticAccountsApi } from './api'
import { analyticAccountKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { AnalyticAccountInput, AnalyticAccountUpdateInput } from '@/types/accounting'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useAnalyticAccounts() {
  const role = useRole()
  return useQuery({ queryKey: analyticAccountKeys.lists(), queryFn: () => analyticAccountsApi.list(role) })
}

export function useAnalyticAccount(id: number) {
  const { data: accounts, ...rest } = useAnalyticAccounts()
  return { ...rest, data: accounts?.find((account) => account.id === id) }
}

export function useCreateAnalyticAccount() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AnalyticAccountInput) => analyticAccountsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticAccountKeys.lists() })
      toast.success('Analytic account created')
    },
  })
}

export function useUpdateAnalyticAccount(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AnalyticAccountUpdateInput) => analyticAccountsApi.update(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticAccountKeys.lists() })
      toast.success('Analytic account updated')
    },
  })
}

export function useDeleteAnalyticAccount() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => analyticAccountsApi.remove(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticAccountKeys.lists() })
      toast.success('Analytic account deleted')
    },
  })
}
