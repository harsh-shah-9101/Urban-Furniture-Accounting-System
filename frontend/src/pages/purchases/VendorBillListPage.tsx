import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useVendorBills } from '@/features/purchases/hooks'
import { useContacts } from '@/features/contacts/hooks'
import type { VendorBill } from '@/types/purchases'

export function VendorBillListPage() {
  const { data: bills, isLoading, isError } = useVendorBills()
  const { data: contacts } = useContacts()
  const navigate = useNavigate()

  const vendorName = (vendorId: number) => contacts?.find((c) => c.id === vendorId)?.name ?? `Vendor #${vendorId}`

  const columns: ColumnDef<VendorBill, unknown>[] = [
    { id: 'id', header: 'Bill #', cell: ({ row }) => `#${row.original.id}` },
    { id: 'vendor', header: 'Vendor', cell: ({ row }) => vendorName(row.original.vendorId) },
    { id: 'po', header: 'Purchase Order', cell: ({ row }) => `#${row.original.purchaseOrderId}` },
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
      <PageHeader title="Vendor Bills" />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load vendor bills." />}
      {bills && (
        <DataTable
          columns={columns}
          data={bills}
          searchPlaceholder="Search vendor bills..."
          onRowClick={(bill) => navigate(`/purchases/bills/${bill.id}`)}
          emptyTitle="No vendor bills yet"
          emptyDescription="Vendor bills are created from confirmed purchase orders."
        />
      )}
    </div>
  )
}
