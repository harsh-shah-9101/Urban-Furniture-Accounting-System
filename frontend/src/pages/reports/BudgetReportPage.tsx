import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function BudgetReportPage() {
  return (
    <div>
      <PageHeader title="Budget Report" />
      <EmptyState title="Computed from the ledger in Milestone 10" />
    </div>
  )
}
