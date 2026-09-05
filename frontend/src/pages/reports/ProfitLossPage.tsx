import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function ProfitLossPage() {
  return (
    <div>
      <PageHeader title="Profit & Loss" />
      <EmptyState title="Computed from the ledger in Milestone 10" />
    </div>
  )
}
