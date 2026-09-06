import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { formatDate } from '@/lib/formatters'
import { usePortalPaymentHistory, type PortalPaymentRow } from '@/features/customer-portal/hooks'

export function PortalPaymentHistoryPage() {
  const { rows, isLoading, isError } = usePortalPaymentHistory()

  const columns: ColumnDef<PortalPaymentRow, unknown>[] = [
    {
      id: 'paymentDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.paymentDate),
    },
    {
      id: 'invoice',
      header: 'Invoice',
      cell: ({ row }) => row.original.invoiceNumber ?? row.original.invoiceId,
    },
    { accessorKey: 'method', header: 'Method' },
    {
      id: 'reference',
      header: 'Reference',
      cell: ({ row }) => row.original.reference ?? '—',
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <CurrencyText amount={row.original.amount} />,
    },
  ]

  return (
    <div>
      <PageHeader title="Payment History" />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load your payment history." />}
      {!isLoading && !isError && (
        <DataTable
          columns={columns}
          data={rows}
          searchPlaceholder="Search payments..."
          emptyTitle="No payments yet"
          emptyDescription="Payments you make will show up here."
        />
      )}
    </div>
  )
}
