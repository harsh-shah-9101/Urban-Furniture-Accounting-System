import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { analyticAccountsApi } from './api'
import { analyticAccountKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { AnalyticAccountInput } from '@/types/accounting'

export function useAnalyticAccounts() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({ queryKey: analyticAccountKeys.lists(), queryFn: () => analyticAccountsApi.list(role) })
}

export function useAnalyticAccount(id: string) {
  const { data: accounts, ...rest } = useAnalyticAccounts()
  return { ...rest, data: accounts?.find((account) => account.id === id) }
}

export function useCreateAnalyticAccount() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AnalyticAccountInput) => analyticAccountsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: analyticAccountKeys.lists() })
      toast.success('Analytic account created')
    },
  })
}
