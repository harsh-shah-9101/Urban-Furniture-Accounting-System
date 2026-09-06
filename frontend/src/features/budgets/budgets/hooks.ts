import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { budgetsApi } from './api'
import { budgetKeys } from './query-keys'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { BudgetInput, BudgetUpdateInput } from '@/types/budgets'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useBudgets() {
  const role = useRole()
  return useQuery({ queryKey: budgetKeys.lists(), queryFn: () => budgetsApi.list(role) })
}

export function useBudget(id: number) {
  const { data: budgets, ...rest } = useBudgets()
  return { ...rest, data: budgets?.find((budget) => budget.id === id) }
}

export function useCreateBudget() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetInput) => budgetsApi.create(input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget created')
    },
  })
}

export function useUpdateBudget(id: number) {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BudgetUpdateInput) => budgetsApi.update(id, input, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget updated')
    },
  })
}

export function useDeleteBudget() {
  const role = useRole()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => budgetsApi.remove(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget deleted')
    },
  })
}
