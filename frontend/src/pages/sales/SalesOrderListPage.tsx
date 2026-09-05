import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button } from '@/components/ui/button'
import { useSalesOrders } from '@/features/sales/hooks'
import { useContacts } from '@/features/contacts/hooks'
import type { SalesOrder } from '@/types/sales'

export function SalesOrderListPage() {
  const { data: orders, isLoading, isError } = useSalesOrders()
  const { data: contacts } = useContacts()
  const navigate = useNavigate()

  const customerName = (customerId: number) => contacts?.find((c) => c.id === customerId)?.name ?? `Customer ${customerId}`

  const columns: ColumnDef<SalesOrder, unknown>[] = [
    { id: 'id', header: 'SO', cell: ({ row }) => `${row.original.id}` },
    { id: 'customer', header: 'Customer', cell: ({ row }) => customerName(row.original.customerId) },
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
        title="Sales Orders"
        actions={<Button onClick={() => navigate('/sales/orders/new')}>New Sales Order</Button>}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load sales orders." />}
      {orders && (
        <DataTable
          columns={columns}
          data={orders}
          searchPlaceholder="Search sales orders..."
          onRowClick={(order) => navigate(`/sales/orders/${order.id}`)}
          emptyTitle="No sales orders yet"
          emptyDescription="Create your first sales order to get started."
        />
      )}
    </div>
  )
}
