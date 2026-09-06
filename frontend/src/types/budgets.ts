export interface Budget {
  id: number
  name: string
  analyticAccountId: number | null
  budgetAmount: number
  spentAmount: number
  remainingAmount: number
  startDate: string | null
  endDate: string | null
  archived: boolean
}

export type BudgetInput = Omit<Budget, 'id' | 'spentAmount' | 'remainingAmount' | 'archived'>
export type BudgetUpdateInput = Partial<Omit<Budget, 'id' | 'archived'>>
