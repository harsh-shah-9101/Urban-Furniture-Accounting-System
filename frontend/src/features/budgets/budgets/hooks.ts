import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { budgetsApi } from './api'
import { budgetKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { BudgetInput } from '@/types/budgets'

export function useBudgets() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  return useQuery({ queryKey: budgetKeys.lists(), queryFn: () => budgetsApi.list(role) })
}

export function useBudget(id: string) {
  const { data: budgets, ...rest } = useBudgets()
  return { ...rest, data: budgets?.find((budget) => budget.id === id) }
}

export function useCreateBudget() {
  const { user } = useAuth()
  const role = user ? toBackendRole(user.role) : undefined
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget created')
    },
  })
}
