import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function AnalyticAccountListPage() {
  return (
    <div>
      <PageHeader title="Analytic Accounts" description="Tag income/expenses by project or department" />
      <EmptyState title="Analytic Account CRUD coming in Milestone 9" />
    </div>
  )
}
