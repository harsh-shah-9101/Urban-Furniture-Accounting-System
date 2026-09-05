import type { ID, Timestamped } from './common'

export interface Budget extends Timestamped {
  id: ID
  name: string
  analyticAccountId: string
  periodStart: string
  periodEnd: string
  responsiblePerson: string
  plannedAmount: number
  archived: boolean
}

export type BudgetInput = Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'archived'>
