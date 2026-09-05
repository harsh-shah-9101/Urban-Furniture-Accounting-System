import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Printer, ShoppingBag, Send, FileText } from 'lucide-react'
import {
  useConfirmSalesOrder,
  useCreateInvoiceFromSalesOrder,
  useSalesOrder,
} from '@/features/sales/hooks'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'



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
    <div className="mx-auto max-w-4xl pb-10">
      <div className="print:hidden">
        <PageHeader
          title={`Sales Order #${order.id}`}
          description={`Customer: ${customerName}`}
          backTo="/sales/orders"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {order.status === 'draft' && (
                <Button onClick={() => confirmOrder.mutate()} disabled={confirmOrder.isPending} className="bg-primary hover:bg-primary/90">
                  <Send className="mr-2 h-4 w-4" />
                  {confirmOrder.isPending ? 'Confirming...' : 'Confirm Order'}
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
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {createInvoice.isPending ? 'Creating Invoice...' : 'Create Customer Invoice'}
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="mt-6 flex flex-col gap-6 print:mt-0">
        <Card className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md print:border-none print:shadow-none">
          <CardHeader className="bg-muted/30 border-b border-border/50 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  SALES ORDER
                </CardTitle>
                {order.notes && <p className="mt-2 text-sm text-muted-foreground italic">"{order.notes}"</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={order.status} />
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">SO No.</p>
                  <p className="font-mono text-lg font-semibold">SO-{order.id.toString().padStart(5, '0')}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 py-6">
            <div className="mb-8 grid grid-cols-2 gap-10">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Order For</p>
                <p className="text-lg font-medium">{customerName}</p>
                <p className="text-sm text-muted-foreground">Customer ID: {order.customerId}</p>
              </div>
              <div className="text-right">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Seller</p>
                <p className="text-lg font-medium">Urban Furniture Inc.</p>
                <p className="text-sm text-muted-foreground">123 Design Avenue<br/>Craftsville, CA 90210</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[45%] font-semibold">Description</TableHead>
                    <TableHead className="text-right font-semibold">Qty</TableHead>
                    <TableHead className="text-right font-semibold">Unit Price</TableHead>
                    <TableHead className="text-right font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.lines.map((line) => (
                    <TableRow key={line.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">{productName(line.productId)}</TableCell>
                      <TableCell className="text-right">{line.quantity}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyText amount={line.unitPrice} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <CurrencyText amount={line.lineTotal} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-1/2 rounded-lg bg-muted/30 p-4 border border-border/50">
                <div className="flex items-center justify-between font-semibold text-lg">
                  <span>Total Amount</span>
                  <CurrencyText amount={order.totalAmount} className="text-xl text-primary" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SalesOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  return <SalesOrderDetail id={Number(id)} />
}
