import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function PortalPaymentHistoryPage() {
  return (
    <div>
      <PageHeader title="Payment History" />
      <EmptyState title="Payment history coming in Milestone 11" />
    </div>
  )
}
