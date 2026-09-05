import { useParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { usePortalInvoice } from '@/features/customer-portal/hooks'
import { usePayInvoiceWithRazorpay } from '@/features/payments/hooks'

export function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invoiceId = Number(id)
  const { data: invoice, isLoading, isError } = usePortalInvoice(invoiceId)
  const payWithRazorpay = usePayInvoiceWithRazorpay(invoiceId)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !invoice) return <ErrorState message="Invoice not found." />

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.id}`}
        description={`from Sales Order ${invoice.salesOrderId}`}
        backTo="/portal/invoices"
      />

      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-4">
          <StatusBadge status={invoice.status} />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.lines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>Product #{line.productId}</TableCell>
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
            Total: <CurrencyText amount={invoice.totalAmount} className="ml-2" />
          </div>
        </CardContent>
      </Card>

      {invoice.status === 'posted' && (
        <Card className="mt-4 max-w-2xl">
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Pay this invoice securely online via Razorpay.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => payWithRazorpay.mutate()} disabled={payWithRazorpay.isPending}>
              {payWithRazorpay.isPending ? 'Processing...' : 'Pay Now'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
