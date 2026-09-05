import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { usePurchaseOrders } from '@/features/purchases/hooks'
import { useContacts } from '@/features/contacts/hooks'
import type { PurchaseOrder } from '@/types/purchases'

export function PurchaseOrderListPage() {
  const { data: orders, isLoading, isError } = usePurchaseOrders()
  const { data: contacts } = useContacts()
  const navigate = useNavigate()

  const vendorName = (vendorId: number) => contacts?.find((c) => c.id === vendorId)?.name ?? `Vendor #${vendorId}`

  const columns: ColumnDef<PurchaseOrder, unknown>[] = [
    { id: 'id', header: 'PO #', cell: ({ row }) => `#${row.original.id}` },
    { id: 'vendor', header: 'Vendor', cell: ({ row }) => vendorName(row.original.vendorId) },
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
      <PageHeader
        title="Purchase Orders"
        actions={<Button onClick={() => navigate('/purchases/orders/new')}>New Purchase Order</Button>}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load purchase orders." />}
      {orders && (
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search purchase orders..."
          onRowClick={(order) => navigate(`/purchases/orders/${order.id}`)}
          emptyTitle="No purchase orders yet"
          emptyDescription="Create your first purchase order to get started."
        />
      )}
    </div>
  )
}
