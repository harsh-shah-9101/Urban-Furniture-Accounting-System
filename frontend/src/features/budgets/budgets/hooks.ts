import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { budgetsStore } from './local-store'
import { budgetKeys } from './query-keys'
import type { BudgetInput, BudgetUpdateInput } from '@/types/budgets'

export function useBudgets() {
  return useQuery({ queryKey: budgetKeys.lists(), queryFn: () => budgetsStore.list() })
}

export function useBudget(id: number) {
  const { data: budgets, ...rest } = useBudgets()
  return { ...rest, data: budgets?.find((budget) => budget.id === id) }
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BudgetInput) => budgetsStore.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget created')
    },
  })
}

export function useUpdateBudget(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: BudgetUpdateInput) => budgetsStore.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget updated')
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => budgetsStore.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget deleted')
    },
  })
}

export function useConfirmBudget(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => budgetsStore.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget confirmed')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useCancelBudget(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => budgetsStore.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Budget cancelled')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useReviseBudget(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => budgetsStore.revise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() })
      toast.success('Revised budget created')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}
