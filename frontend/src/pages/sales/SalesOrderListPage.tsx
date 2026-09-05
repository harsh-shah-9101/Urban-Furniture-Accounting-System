import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function SalesOrderListPage() {
  return (
    <div>
      <PageHeader title="Sales Orders" />
      <EmptyState title="Sales Order flow coming in Milestone 7" />
    </div>
  )
}
