import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { accountsApi } from './api'
import { accountKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { AccountInput, AccountUpdateInput } from '@/types/accounting'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useAccounts() {
  const role = useRole()
  return useQuery({ queryKey: accountKeys.lists(), queryFn: () => accountsApi.list(role) })
}

export function useCreateAccount() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AccountInput) => accountsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Account created')
    },
  })
}

export function useUpdateAccount(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AccountUpdateInput) => accountsApi.update(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Account updated')
    },
  })
}

export function useDeleteAccount() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => accountsApi.remove(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      toast.success('Account deleted')
    },
  })
}
