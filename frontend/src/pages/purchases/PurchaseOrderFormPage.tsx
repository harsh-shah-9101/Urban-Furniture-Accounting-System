import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { DocumentView } from '@/components/data-display/DocumentView'
import { Button } from '@/components/ui/button'
import { Printer, ShoppingCart, Send, FileText, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import {
  useCancelPurchaseOrder,
  useConfirmPurchaseOrder,
  useCreateBillFromPurchaseOrder,
  usePurchaseOrder,
} from '@/features/purchases/hooks'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'

function PurchaseOrderDetail({ id }: { id: number }) {
  const navigate = useNavigate()
  const { data: order, isLoading, isError } = usePurchaseOrder(id)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const confirmOrder = useConfirmPurchaseOrder(id)
  const cancelOrder = useCancelPurchaseOrder(id)
  const createBill = useCreateBillFromPurchaseOrder(id)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !order) return <ErrorState message="Purchase order not found." />

  const vendorName = contacts?.find((c) => c.id === order.vendorId)?.name ?? `Vendor ${order.vendorId}`
  const productName = (id: number) => products?.find((p) => p.id === id)?.name ?? `Product ${id}`

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="print:hidden">
        <PageHeader
          title={`Purchase Order #${order.id}`}
          description={`Vendor: ${vendorName}`}
          backTo="/purchases/orders"
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
                    createBill.mutate(undefined, {
                      onSuccess: (bill) => navigate(`/purchases/bills/${bill.id}`),
                    })
                  }
                  disabled={createBill.isPending}
                  variant="secondary"
                  className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {createBill.isPending ? 'Creating Bill...' : 'Create Vendor Bill'}
                </Button>
              )}
              {(order.status === 'draft' || order.status === 'confirmed') && (
                <Button variant="destructive" onClick={() => setIsCancelOpen(true)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="mt-6 flex flex-col gap-6 print:mt-0">
        <DocumentView
          title="PURCHASE ORDER"
          icon={ShoppingCart}
          reference={order.notes ? <p className="italic">"{order.notes}"</p> : undefined}
          status={<StatusBadge status={order.status} />}
          documentNoLabel="PO No."
          documentNo={order.poNumber ?? `PO-${order.id.toString().padStart(5, '0')}`}
          meta={[{ label: 'Order Date', value: formatDate(order.orderDate) }]}
          leftParty={{
            label: 'Order From',
            name: vendorName,
            details: <>Vendor ID: {order.vendorId}</>,
          }}
          rightParty={{
            label: 'Delivery To',
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

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Cancel this purchase order?"
        description="This can't be undone."
        confirmLabel="Cancel Order"
        destructive
        onConfirm={() => cancelOrder.mutate()}
      />
    </div>
  )
}

export function PurchaseOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  return <PurchaseOrderDetail id={Number(id)} />
}
