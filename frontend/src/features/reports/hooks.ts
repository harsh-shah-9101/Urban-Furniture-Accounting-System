import { useQuery } from '@tanstack/react-query'
import { reportsApi } from './api'
import { useAuth } from '@/features/auth/useAuth'
import { toBackendRole } from '@/features/auth/roles'
import type { BudgetReportInput } from '@/types/reports'

function useRole() {
  const { user } = useAuth()
  return user ? toBackendRole(user.role) : undefined
}

export function useTrialBalance() {
  const role = useRole()
  return useQuery({ queryKey: ['reports', 'trial-balance'], queryFn: () => reportsApi.trialBalance(role) })
}

export function useBalanceSheet() {
  const role = useRole()
  return useQuery({ queryKey: ['reports', 'balance-sheet'], queryFn: () => reportsApi.balanceSheet(role) })
}

export function useProfitLoss() {
  const role = useRole()
  return useQuery({ queryKey: ['reports', 'profit-loss'], queryFn: () => reportsApi.profitLoss(role) })
}

export function useBudgetReport(input: BudgetReportInput) {
  const role = useRole()
  return useQuery({
    queryKey: ['reports', 'budget', input.targetIncome ?? null, input.budgetedExpense ?? null],
    queryFn: () => reportsApi.budget(input, role),
  })
}
