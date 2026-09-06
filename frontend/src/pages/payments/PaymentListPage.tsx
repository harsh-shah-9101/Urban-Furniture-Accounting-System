import { useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { usePayments, useCreatePayment } from '@/features/payments/hooks'
import { useContacts } from '@/features/contacts/hooks'
import { PaymentForm } from '@/features/payments/components/PaymentForm'
import type { Payment } from '@/types/payments'
import type { PaymentFormValues } from '@/features/payments/schema'

export function PaymentListPage() {
  const { data: payments, isLoading, isError } = usePayments()
  const { data: contacts } = useContacts()
  const createPayment = useCreatePayment()
  const navigate = useNavigate()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  function handleCreateSubmit(values: PaymentFormValues) {
    const input = {
      ...values,
      reference: values.reference || null,
      note: values.note || null,
    }
    createPayment.mutate(input, {
      onSuccess: () => setIsDialogOpen(false),
    })
  }

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
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Payment
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Payment</DialogTitle>
              </DialogHeader>
              <PaymentForm onSubmit={handleCreateSubmit} isSubmitting={createPayment.isPending} />
            </DialogContent>
          </Dialog>
        }
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
