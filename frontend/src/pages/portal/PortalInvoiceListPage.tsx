import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'

export function PortalInvoiceListPage() {
  return (
    <div>
      <PageHeader title="My Invoices & Bills" />
      <EmptyState title="Contact portal coming in Milestone 11" />
    </div>
  )
}
