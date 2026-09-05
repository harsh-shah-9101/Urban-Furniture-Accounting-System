export interface BalanceSheetRow {
  accountId: string
  accountName: string
  balance: number
}

export interface BalanceSheet {
  asOfDate: string
  assets: BalanceSheetRow[]
  liabilities: BalanceSheetRow[]
  capital: BalanceSheetRow[]
  totals: { assets: number; liabilities: number; capital: number }
  isBalanced: boolean
}

export interface ProfitAndLoss {
  periodStart: string
  periodEnd: string
  income: BalanceSheetRow[]
  expenses: BalanceSheetRow[]
  totalIncome: number
  totalExpenses: number
  netProfit: number
}

export interface BudgetReportRow {
  budgetId: string
  budgetName: string
  analyticAccountName: string
  planned: number
  actual: number
  variance: number
  variancePct: number
}

export interface BudgetReport {
  periodStart: string
  periodEnd: string
  rows: BudgetReportRow[]
}
