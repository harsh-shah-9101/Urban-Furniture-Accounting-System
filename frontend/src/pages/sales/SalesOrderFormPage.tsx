import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { SalesOrderForm } from '@/features/sales/components/SalesOrderForm'
import {
  useConfirmSalesOrder,
  useCreateInvoiceFromSalesOrder,
  useCreateSalesOrder,
  useSalesOrder,
} from '@/features/sales/hooks'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import type { SalesOrderFormValues } from '@/features/sales/schema'

function CreateSalesOrder() {
  const navigate = useNavigate()
  const createOrder = useCreateSalesOrder()

  function handleSubmit(values: SalesOrderFormValues) {
    createOrder.mutate(
      { ...values, notes: values.notes || null },
      { onSuccess: (created) => navigate(`/sales/orders/${created.id}`) },
    )
  }

  return (
    <div>
      <PageHeader title="New Sales Order" backTo="/sales/orders" />
      <SalesOrderForm onSubmit={handleSubmit} isSubmitting={createOrder.isPending} />
    </div>
  )
}

function SalesOrderDetail({ id }: { id: number }) {
  const navigate = useNavigate()
  const { data: order, isLoading, isError } = useSalesOrder(id)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const confirmOrder = useConfirmSalesOrder(id)
  const createInvoice = useCreateInvoiceFromSalesOrder(id)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !order) return <ErrorState message="Sales order not found." />

  const customerName = contacts?.find((c) => c.id === order.customerId)?.name ?? `Customer ${order.customerId}`
  const productName = (id: number) => products?.find((p) => p.id === id)?.name ?? `Product ${id}`

  return (
    <div>
      <PageHeader
        title={`Sales Order ${order.id}`}
        description={customerName}
        backTo="/sales/orders"
        actions={
          <div className="flex gap-2">
            {order.status === 'draft' && (
              <Button onClick={() => confirmOrder.mutate()} disabled={confirmOrder.isPending}>
                {confirmOrder.isPending ? 'Confirming...' : 'Confirm'}
              </Button>
            )}
            {order.status === 'confirmed' && (
              <Button
                onClick={() =>
                  createInvoice.mutate(undefined, {
                    onSuccess: (invoice) => navigate(`/sales/invoices/${invoice.id}`),
                  })
                }
                disabled={createInvoice.isPending}
              >
                {createInvoice.isPending ? 'Creating Invoice...' : 'Create Customer Invoice'}
              </Button>
            )}
          </div>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {order.notes && <span className="text-sm text-muted-foreground">{order.notes}</span>}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>{productName(line.productId)}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyText amount={line.unitPrice} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyText amount={line.lineTotal} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end text-sm font-medium">
            Total: <CurrencyText amount={order.totalAmount} className="ml-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SalesOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <SalesOrderDetail id={Number(id)} /> : <CreateSalesOrder />
}
