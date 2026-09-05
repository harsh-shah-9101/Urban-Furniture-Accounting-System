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
import { usePayVendorBill, usePostVendorBill, useVendorBill } from '@/features/purchases/hooks'
import { billPaymentSchema, type BillPaymentFormValues } from '@/features/purchases/schema'

function RegisterPaymentForm({ billId }: { billId: number }) {
  const payBill = usePayVendorBill(billId)
  const form = useForm<BillPaymentFormValues>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: { method: 'bank', amount: undefined, reference: '' },
  })

  function handleSubmit(values: BillPaymentFormValues) {
    payBill.mutate({
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

        <Button type="submit" disabled={payBill.isPending}>
          {payBill.isPending ? 'Registering...' : 'Register Payment'}
        </Button>
      </form>
    </Form>
  )
}

export function VendorBillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const billId = Number(id)
  const { data: bill, isLoading, isError } = useVendorBill(billId)
  const { data: contacts } = useContacts()
  const { data: products } = useProducts()
  const postBill = usePostVendorBill(billId)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !bill) return <ErrorState message="Vendor bill not found." />

  const vendorName = contacts?.find((c) => c.id === bill.vendorId)?.name ?? `Vendor #${bill.vendorId}`
  const productName = (productId: number) => products?.find((p) => p.id === productId)?.name ?? `Product #${productId}`

  return (
    <div>
      <PageHeader
        title={`Vendor Bill #${bill.id}`}
        description={`${vendorName} · from Purchase Order #${bill.purchaseOrderId}`}
        actions={
          bill.status === 'draft' ? (
            <Button onClick={() => postBill.mutate()} disabled={postBill.isPending}>
              {postBill.isPending ? 'Posting...' : 'Post Bill'}
            </Button>
          ) : undefined
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-4">
          <StatusBadge status={bill.status} />

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
              {bill.lines.map((line) => (
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
            Total: <CurrencyText amount={bill.totalAmount} className="ml-2" />
          </div>
        </CardContent>
      </Card>

      {bill.status === 'posted' && (
        <Card className="mt-4 max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Register Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <RegisterPaymentForm billId={bill.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
