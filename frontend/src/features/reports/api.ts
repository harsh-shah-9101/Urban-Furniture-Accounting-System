import { apiGet, roleHeaders } from '@/lib/http'
import type { BackendUserRole } from '@/types/auth'
import type { BalanceSheet, BudgetReport, BudgetReportInput, ProfitAndLoss, TrialBalanceLine } from '@/types/reports'

interface TrialBalanceLineDto {
  account_id: number
  code: string
  name: string
  account_type: TrialBalanceLine['accountType']
  debit: string
  credit: string
  balance: string
}

interface BalanceSheetDto {
  assets: string
  liabilities: string
  capital: string
  net_profit: string
  difference: string
}

interface ProfitLossDto {
  income: string
  expense: string
  net_profit: string
}

interface BudgetReportDto {
  target_income: string
  actual_income: string
  income_variance: string
  budgeted_expense: string
  actual_expense: string
  expense_variance: string
  net_profit: string
}

function fromTrialBalanceLineDto(dto: TrialBalanceLineDto): TrialBalanceLine {
  return {
    accountId: dto.account_id,
    code: dto.code,
    name: dto.name,
    accountType: dto.account_type,
    debit: Number(dto.debit),
    credit: Number(dto.credit),
    balance: Number(dto.balance),
  }
}

function fromBalanceSheetDto(dto: BalanceSheetDto): BalanceSheet {
  return {
    assets: Number(dto.assets),
    liabilities: Number(dto.liabilities),
    capital: Number(dto.capital),
    netProfit: Number(dto.net_profit),
    difference: Number(dto.difference),
  }
}

function fromProfitLossDto(dto: ProfitLossDto): ProfitAndLoss {
  return {
    income: Number(dto.income),
    expense: Number(dto.expense),
    netProfit: Number(dto.net_profit),
  }
}

function fromBudgetReportDto(dto: BudgetReportDto): BudgetReport {
  return {
    targetIncome: Number(dto.target_income),
    actualIncome: Number(dto.actual_income),
    incomeVariance: Number(dto.income_variance),
    budgetedExpense: Number(dto.budgeted_expense),
    actualExpense: Number(dto.actual_expense),
    expenseVariance: Number(dto.expense_variance),
    netProfit: Number(dto.net_profit),
  }
}

export const reportsApi = {
  trialBalance: async (role?: BackendUserRole) => {
    const dtos = await apiGet<TrialBalanceLineDto[]>('/reports/trial-balance', roleHeaders(role))
    return dtos.map(fromTrialBalanceLineDto)
  },
  balanceSheet: async (role?: BackendUserRole) => {
    const dto = await apiGet<BalanceSheetDto>('/reports/balance-sheet', roleHeaders(role))
    return fromBalanceSheetDto(dto)
  },
  profitLoss: async (role?: BackendUserRole) => {
    const dto = await apiGet<ProfitLossDto>('/reports/profit-loss', roleHeaders(role))
    return fromProfitLossDto(dto)
  },
  budget: async (input: BudgetReportInput, role?: BackendUserRole) => {
    const params = new URLSearchParams()
    if (input.targetIncome !== undefined) params.set('target_income', String(input.targetIncome))
    if (input.budgetedExpense !== undefined) params.set('budgeted_expense', String(input.budgetedExpense))
    const query = params.toString()
    const dto = await apiGet<BudgetReportDto>(`/reports/budget${query ? `?${query}` : ''}`, roleHeaders(role))
    return fromBudgetReportDto(dto)
  },
}
