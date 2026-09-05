import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { CurrencyText } from '@/components/data-display/CurrencyText'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form } from '@/components/ui/form'
import { FormField } from '@/components/forms/FormField'
import { useContacts } from '@/features/contacts/hooks'
import { useProducts } from '@/features/products/hooks'
import { useCustomerInvoice, usePayCustomerInvoice, usePostCustomerInvoice } from '@/features/sales/hooks'
import { customerPaymentSchema, type CustomerPaymentFormValues } from '@/features/sales/schema'

function RegisterPaymentForm({ invoiceId }: { invoiceId: number }) {
  const payInvoice = usePayCustomerInvoice(invoiceId)
  const form = useForm<CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: { method: 'bank', amount: undefined, reference: '' },
  })

  function handleSubmit(values: CustomerPaymentFormValues) {
    payInvoice.mutate({
      method: values.method,
      amount: values.amount ?? null,
      reference: values.reference || null,
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

        <Button type="submit" disabled={payInvoice.isPending}>
          {payInvoice.isPending ? 'Registering...' : 'Register Payment'}
        </Button>
      </form>
    </Form>
  )
}

export function CustomerInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invoiceId = Number(id)
  const { data: invoice, isLoading, isError } = useCustomerInvoice(invoiceId)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const postInvoice = usePostCustomerInvoice(invoiceId)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !invoice) return <ErrorState message="Customer invoice not found." />

  const customerName = contacts?.find((c) => c.id === invoice.customerId)?.name ?? `Customer ${invoice.customerId}`
  const productName = (productId: number) => products?.find((p) => p.id === productId)?.name ?? `Product ${productId}`

  return (
    <div>
      <PageHeader
        title={`Customer Invoice ${invoice.id}`}
        description={`${customerName} · from Sales Order ${invoice.salesOrderId}`}
        backTo="/sales/invoices"
        actions={
          invoice.status === 'draft' ? (
            <Button onClick={() => postInvoice.mutate()} disabled={postInvoice.isPending}>
              {postInvoice.isPending ? 'Posting...' : 'Post Invoice'}
            </Button>
          ) : undefined
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-4">
          <StatusBadge status={invoice.status} />

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
              {invoice.lines.map((line) => (
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
            Total: <CurrencyText amount={invoice.totalAmount} className="ml-2" />
          </div>
        </CardContent>
      </Card>

      {invoice.status === 'posted' && (
        <Card className="mt-4 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Register Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterPaymentForm invoiceId={invoice.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
