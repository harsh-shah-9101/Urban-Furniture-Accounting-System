import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/formatters'
import { usePayments } from '@/features/payments/hooks'
import { useContacts } from '@/features/contacts/hooks'
import type { Payment } from '@/types/payments'

export function PaymentListPage() {
  const { data: payments, isLoading, isError } = usePayments()
  const { data: contacts } = useContacts()
  const navigate = useNavigate()

  const partnerName = (id: number | null) =>
    contacts?.find((c) => c.id === id)?.name ?? (id !== null ? `Contact ${id}` : '—')

  const columns: ColumnDef<Payment, unknown>[] = [
    {
      id: 'paymentNumber',
      header: 'Payment',
      cell: ({ row }) => row.original.paymentNumber ?? `PAY-${row.original.id.toString().padStart(5, '0')}`,
    },
    {
      id: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.paymentType}
        </Badge>
      ),
    },
    { id: 'partner', header: 'Partner', cell: ({ row }) => partnerName(row.original.partnerId) },
    {
      id: 'date',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.paymentDate),
    },
    { accessorKey: 'method', header: 'Via', cell: ({ row }) => <span className="capitalize">{row.original.method}</span> },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <CurrencyText amount={row.original.amount} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payments"
        description="All payments across purchases and sales"
        actions={<Button onClick={() => navigate('/payments/new')}>New Payment</Button>}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load payments." />}
      {payments && (
        <DataTable
          columns={columns}
          data={payments}
          searchPlaceholder="Search payments..."
          onRowClick={(payment) => navigate(`/payments/${payment.id}`)}
          emptyTitle="No payments yet"
          emptyDescription="Record a payment, or register one from a vendor bill or customer invoice."
        />
      )}
    </div>
  )
}
