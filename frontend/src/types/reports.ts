import type { AccountType } from './accounting'

export interface TrialBalanceLine {
  accountId: number
  code: string
  name: string
  accountType: AccountType
  debit: number
  credit: number
  balance: number
}

export interface BalanceSheet {
  assets: number
  liabilities: number
  capital: number
  netProfit: number
  difference: number
}

export interface ProfitAndLoss {
  income: number
  expense: number
  netProfit: number
}

export interface BudgetReportInput {
  targetIncome?: number
  budgetedExpense?: number
}

export interface BudgetReport {
  targetIncome: number
  actualIncome: number
  incomeVariance: number
  budgetedExpense: number
  actualExpense: number
  expenseVariance: number
  netProfit: number
}
