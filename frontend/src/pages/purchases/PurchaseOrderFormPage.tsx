import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { PurchaseOrderForm } from '@/features/purchases/components/PurchaseOrderForm'
import {
  useCancelPurchaseOrder,
  useConfirmPurchaseOrder,
  useCreateBillFromPurchaseOrder,
  useCreatePurchaseOrder,
  usePurchaseOrder,
} from '@/features/purchases/hooks'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import type { PurchaseOrderFormValues } from '@/features/purchases/schema'

function CreatePurchaseOrder() {
  const navigate = useNavigate()
  const createOrder = useCreatePurchaseOrder()

  function handleSubmit(values: PurchaseOrderFormValues) {
    createOrder.mutate(
      { ...values, notes: values.notes || null },
      { onSuccess: (created) => navigate(`/purchases/orders/${created.id}`) },
    )
  }

  return (
    <div>
      <PageHeader title="New Purchase Order" backTo="/purchases/orders" />
      <PurchaseOrderForm onSubmit={handleSubmit} isSubmitting={createOrder.isPending} />
    </div>
  )
}

function PurchaseOrderDetail({ id }: { id: number }) {
  const navigate = useNavigate()
  const { data: order, isLoading, isError } = usePurchaseOrder(id)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const confirmOrder = useConfirmPurchaseOrder(id)
  const createBill = useCreateBillFromPurchaseOrder(id)
  const cancelOrder = useCancelPurchaseOrder(id)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !order) return <ErrorState message="Purchase order not found." />

  const vendorName = contacts?.find((c) => c.id === order.vendorId)?.name ?? `Vendor ${order.vendorId}`
  const productName = (id: number) => products?.find((p) => p.id === id)?.name ?? `Product ${id}`
  const canCancel = order.status === 'draft' || order.status === 'confirmed'

  return (
    <div>
      <PageHeader
        title={`Purchase Order ${order.id}`}
        description={vendorName}
        backTo="/purchases/orders"
        actions={
          <div className="flex gap-2">
            {canCancel && (
              <Button variant="outline" onClick={() => setCancelDialogOpen(true)} disabled={cancelOrder.isPending}>
                {cancelOrder.isPending ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
            {order.status === 'draft' && (
              <Button onClick={() => confirmOrder.mutate()} disabled={confirmOrder.isPending}>
                {confirmOrder.isPending ? 'Confirming...' : 'Confirm'}
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
              >
                {createBill.isPending ? 'Creating Bill...' : 'Create Vendor Bill'}
              </Button>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel this purchase order?"
        description="This cannot be undone. The order will be marked as cancelled."
        confirmLabel="Cancel Order"
        destructive
        onConfirm={() => cancelOrder.mutate()}
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

export function PurchaseOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <PurchaseOrderDetail id={Number(id)} /> : <CreatePurchaseOrder />
}
