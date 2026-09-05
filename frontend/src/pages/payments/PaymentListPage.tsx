import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function PaymentListPage() {
  return (
    <div>
      <PageHeader title="Payments" description="All payments across purchases and sales" />
      <EmptyState title="Payments list coming in Milestone 8" />
    </div>
  )
}
