import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DocumentView } from '@/components/data-display/DocumentView'
import { Printer, CreditCard, Send, CheckCircle2, Receipt, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/formatters'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import {
  useCancelCustomerInvoice,
  useCustomerInvoice,
  usePayCustomerInvoice,
  usePostCustomerInvoice,
} from '@/features/sales/hooks'
import { customerPaymentSchema, type CustomerPaymentFormValues } from '@/features/sales/schema'
import type { CustomerInvoice } from '@/types/sales'

function RegisterPaymentForm({ invoiceId }: { invoiceId: number }) {
  const payInvoice = usePayCustomerInvoice(invoiceId)
  const form = useForm<CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: { method: 'bank', amount: undefined, reference: '', note: '' },
  })

  function handleSubmit(values: CustomerPaymentFormValues) {
    payInvoice.mutate({
      method: values.method,
      amount: values.amount ?? null,
      reference: values.reference || null,
      note: values.note || null,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-wrap items-end gap-3">
        <FormField control={form.control} name="method" label="Method">
          {(field) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-32">
                <SelectValue>{(value: 'cash' | 'bank') => (value === 'cash' ? 'Cash' : 'Bank')}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          )}
        </FormField>

        <FormField control={form.control} name="amount" label="Amount (optional = full)">
          {(field) => (
            <CurrencyInput
              value={field.value ?? NaN}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        </FormField>

        <FormField control={form.control} name="reference" label="Reference (optional)">
          {(field) => <Input {...field} placeholder="Cheque / UTR no." />}
        </FormField>

        <FormField control={form.control} name="note" label="Note (optional)">
          {(field) => <Input {...field} placeholder="Note" />}
        </FormField>

        <Button type="submit" disabled={payInvoice.isPending}>
          {payInvoice.isPending ? 'Registering...' : 'Register Payment'}
        </Button>
      </form>
    </Form>
  )
}

function PaymentHistoryCard({ invoice }: { invoice: CustomerInvoice }) {
  if (invoice.payments.length === 0) return null

  return (
    <Card className="border-border/50 shadow-sm print:hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                <TableCell className="capitalize">{payment.method}</TableCell>
                <TableCell>{payment.reference ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <CurrencyText amount={payment.amount} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function CustomerInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invoiceId = Number(id)
  const { data: invoice, isLoading, isError } = useCustomerInvoice(invoiceId)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const postInvoice = usePostCustomerInvoice(invoiceId)
  const cancelInvoice = useCancelCustomerInvoice(invoiceId)
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !invoice) return <ErrorState message="Customer invoice not found." />

  const customerName = contacts?.find((c) => c.id === invoice.customerId)?.name ?? `Customer ${invoice.customerId}`
  const productName = (productId: number) => products?.find((p) => p.id === productId)?.name ?? `Product ${productId}`
  const canCancel = invoice.status === 'draft' || invoice.status === 'posted' || invoice.status === 'partially_paid'
  const canPay = invoice.status === 'posted' || invoice.status === 'partially_paid'

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <div className="print:hidden">
        <PageHeader
          title={`Invoice #${invoice.id}`}
          description={`Customer: ${customerName}`}
          backTo="/sales/invoices"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              {invoice.status === 'draft' && (
                <Button onClick={() => postInvoice.mutate()} disabled={postInvoice.isPending} className="bg-primary hover:bg-primary/90">
                  <Send className="mr-2 h-4 w-4" />
                  {postInvoice.isPending ? 'Posting...' : 'Post Invoice'}
                </Button>
              )}
              {canCancel && (
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
          title="INVOICE"
          icon={Receipt}
          reference={<p>Reference: SO-{invoice.salesOrderId}</p>}
          status={<StatusBadge status={invoice.status} />}
          documentNoLabel="Invoice No."
          documentNo={invoice.invoiceNumber ?? `INV-${invoice.id.toString().padStart(5, '0')}`}
          meta={[
            { label: 'Invoice Date', value: formatDate(invoice.invoiceDate) },
            ...(invoice.dueDate ? [{ label: 'Due Date', value: formatDate(invoice.dueDate) }] : []),
          ]}
          leftParty={{
            label: 'Billed To',
            name: customerName,
            details: <>Customer ID: {invoice.customerId}</>,
          }}
          rightParty={{
            label: 'Company',
            name: 'Urban Furniture Inc.',
            details: (
              <>
                123 Design Avenue
                <br />
                Craftsville, CA 90210
              </>
            ),
          }}
          lines={invoice.lines.map((line) => ({
            id: line.id,
            description: productName(line.productId),
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          }))}
          totalAmount={invoice.totalAmount}
          extraTotals={[
            { label: 'Paid via Cash', amount: invoice.paidByCash },
            { label: 'Paid via Bank', amount: invoice.paidByBank },
            {
              label: 'Amount Due',
              amount: invoice.amountDue,
              className: invoice.amountDue > 0 ? 'font-semibold text-destructive' : 'font-semibold',
            },
          ]}
        />

        <PaymentHistoryCard invoice={invoice} />

        {canPay && (
          <Card className="border-border/50 shadow-sm print:hidden border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                Register Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RegisterPaymentForm invoiceId={invoice.id} />
            </CardContent>
          </Card>
        )}

        {invoice.status === 'paid' && (
           <Card className="border-green-500/20 bg-green-500/5 shadow-sm print:hidden">
            <CardContent className="flex items-center justify-center gap-3 py-6 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-lg font-medium">This invoice has been fully paid.</span>
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Cancel this invoice?"
        description="This can't be undone."
        confirmLabel="Cancel Invoice"
        destructive
        onConfirm={() => cancelInvoice.mutate()}
      />
    </div>
  )
}
