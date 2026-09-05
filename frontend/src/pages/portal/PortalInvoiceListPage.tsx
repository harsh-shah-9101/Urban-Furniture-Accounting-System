import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { usePortalInvoices } from '@/features/customer-portal/hooks'
import type { CustomerInvoice } from '@/types/sales'

export function PortalInvoiceListPage() {
  const { data: invoices, isLoading, isError } = usePortalInvoices()
  const navigate = useNavigate()

  const columns: ColumnDef<CustomerInvoice, unknown>[] = [
    { id: 'id', header: 'Invoice', cell: ({ row }) => `${row.original.id}` },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => <CurrencyText amount={row.original.totalAmount} />,
    },
  ]

  return (
    <div>
      <PageHeader title="My Invoices & Bills" />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load your invoices." />}
      {invoices && (
        <DataTable
          columns={columns}
          data={invoices}
          searchPlaceholder="Search invoices..."
          onRowClick={(invoice) => navigate(`/portal/invoices/${invoice.id}`)}
          emptyTitle="No invoices yet"
          emptyDescription="Invoices you're billed for will show up here."
        />
      )}
    </div>
  )
}
