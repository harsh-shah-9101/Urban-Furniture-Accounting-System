import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { accountsApi } from './api'
import { accountKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { AccountInput } from '@/types/accounting'

export function useAccounts() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({ queryKey: accountKeys.lists(), queryFn: () => accountsApi.list(role) })
}

export function useCreateAccount() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AccountInput) => accountsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Account created')
    },
  })
}
