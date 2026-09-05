import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { DocumentView } from '@/components/data-display/DocumentView'
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
        <DocumentView
          title="SALES ORDER"
          icon={ShoppingBag}
          reference={order.notes ? <p className="italic">"{order.notes}"</p> : undefined}
          status={<StatusBadge status={order.status} />}
          documentNoLabel="SO No."
          documentNo={`SO-${order.id.toString().padStart(5, '0')}`}
          leftParty={{
            label: 'Order For',
            name: customerName,
            details: <>Customer ID: {order.customerId}</>,
          }}
          rightParty={{
            label: 'Seller',
            name: 'Urban Furniture Inc.',
            details: (
              <>
                123 Design Avenue
                <br />
                Craftsville, CA 90210
              </>
            ),
          }}
          lines={order.lines.map((line) => ({
            id: line.id,
            description: productName(line.productId),
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          }))}
          totalAmount={order.totalAmount}
        />
      </div>
    </div>
  )
}

export function SalesOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  return <SalesOrderDetail id={Number(id)} />
}
