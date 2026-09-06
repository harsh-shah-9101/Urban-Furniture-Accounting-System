import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable } from '@/components/data-display/DataTable'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useCustomerInvoices } from '@/features/sales/hooks'
import { useContacts } from '@/features/contacts/hooks'
import { formatDate } from '@/lib/formatters'
import type { CustomerInvoice } from '@/types/sales'

export function CustomerInvoiceListPage() {
  const { data: invoices, isLoading, isError } = useCustomerInvoices()
  const { data: contacts } = useContacts()
  const navigate = useNavigate()

  const customerName = (customerId: number) => contacts?.find((c) => c.id === customerId)?.name ?? `Customer ${customerId}`

  const columns: ColumnDef<CustomerInvoice, unknown>[] = [
    {
      id: 'invoiceNumber',
      header: 'Invoice',
      cell: ({ row }) => row.original.invoiceNumber ?? `INV-${row.original.id.toString().padStart(5, '0')}`,
    },
    { id: 'customer', header: 'Customer', cell: ({ row }) => customerName(row.original.customerId) },
    { id: 'so', header: 'Sales Order', cell: ({ row }) => `${row.original.salesOrderId}` },
    {
      id: 'invoiceDate',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.invoiceDate),
    },
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
    {
      accessorKey: 'amountDue',
      header: 'Due',
      cell: ({ row }) => <CurrencyText amount={row.original.amountDue} />,
    },
  ]

  return (
    <div>
      <PageHeader title="Customer Invoices" />

      {isLoading && <LoadingState />}
      {isError && <ErrorState message="Failed to load customer invoices." />}
      {invoices && (
        <DataTable
          columns={columns}
          data={invoices}
          searchPlaceholder="Search customer invoices..."
          onRowClick={(invoice) => navigate(`/sales/invoices/${invoice.id}`)}
          emptyTitle="No customer invoices yet"
          emptyDescription="Customer invoices are created from confirmed sales orders."
        />
      )}
    </div>
  )
}
