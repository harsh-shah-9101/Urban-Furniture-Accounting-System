import { useState } from 'react'
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
import { PayInvoiceDialog } from '@/features/payments/components/PayInvoiceDialog'
import { useAuth } from '@/features/auth/useAuth'

export function PortalInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invoiceId = Number(id)
  const { data: invoice, isLoading, isError } = usePortalInvoice(invoiceId)
  const { user } = useAuth()
  const [payDialogOpen, setPayDialogOpen] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !invoice) return <ErrorState message="Invoice not found." />

  const subtotal = invoice.lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const invoiceNumber = `INV-${String(invoice.id).padStart(6, '0')}`

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Invoice ${invoice.id}`} backTo="/portal/invoices" />

      <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
        {/* Letterhead */}
        <div className="flex flex-col gap-6 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-foreground text-base font-bold text-background">
              UF
            </div>
            <div>
              <div className="text-base font-semibold">Urban Furniture Accounting</div>
              <div className="text-sm text-muted-foreground">Sales Order #{invoice.salesOrderId}</div>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="text-2xl font-semibold tracking-tight">INVOICE</div>
            <div className="mt-1 text-sm text-muted-foreground">{invoiceNumber}</div>
            <div className="mt-2 sm:flex sm:justify-end">
              <StatusBadge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Bill to */}
        <div className="border-b border-border p-6 sm:p-8">
          <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Billed To</div>
          <div className="mt-1.5 text-sm font-medium">{user?.name}</div>
          {user?.email && <div className="text-sm text-muted-foreground">{user.email}</div>}
        </div>

        {/* Line items */}
        <div className="px-6 sm:px-8">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
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
        </div>

        {/* Totals */}
        <div className="flex justify-end p-6 sm:p-8">
          <div className="w-full max-w-[220px] space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <CurrencyText amount={subtotal} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5 text-base font-semibold">
              <span>Total</span>
              <CurrencyText amount={invoice.totalAmount} />
            </div>
          </div>
        </div>
      </div>

      {invoice.status === 'posted' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Pay this invoice securely online via UPI.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setPayDialogOpen(true)}>Pay Now</Button>
          </CardContent>
        </Card>
      )}

      <PayInvoiceDialog
        invoiceId={invoice.id}
        amount={invoice.totalAmount}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
      />
    </div>
  )
}
