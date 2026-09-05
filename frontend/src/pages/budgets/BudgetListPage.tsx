import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function BudgetListPage() {
  return (
    <div>
      <PageHeader title="Budgets" />
      <EmptyState title="Budget CRUD coming in Milestone 9" />
    </div>
  )
}
