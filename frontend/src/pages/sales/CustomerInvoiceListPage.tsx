import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function CustomerInvoiceListPage() {
  return (
    <div>
      <PageHeader title="Customer Invoices" />
      <EmptyState title="Customer Invoice flow coming in Milestone 7" />
    </div>
  )
}
