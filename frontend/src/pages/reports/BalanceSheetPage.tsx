import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function BalanceSheetPage() {
  return (
    <div>
      <PageHeader title="Balance Sheet" />
      <EmptyState title="Computed from the ledger in Milestone 10" />
    </div>
  )
}
