export type BudgetStatus = 'draft' | 'confirmed' | 'revised' | 'cancelled'

export interface BudgetLine {
  id: number
  analyticAccountId: number
  committedAmount: number
}

export interface Budget {
  id: number
  name: string
  startDate: string | null
  endDate: string | null
  status: BudgetStatus
  responsibleContactId: number | null
  revisionOfId: number | null
  revisedWithId: number | null
  lines: BudgetLine[]
}

export interface BudgetLineInput {
  analyticAccountId: number
  committedAmount: number
}

export interface BudgetInput {
  name: string
  startDate?: string | null
  endDate?: string | null
  responsibleContactId?: number | null
  lines: BudgetLineInput[]
}

export type BudgetUpdateInput = Partial<BudgetInput>

export function budgetCommittedTotal(budget: Pick<Budget, 'lines'>): number {
  return budget.lines.reduce((sum, line) => sum + line.committedAmount, 0)
}
