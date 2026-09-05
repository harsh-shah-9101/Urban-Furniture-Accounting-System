import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/feedback/LoadingState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
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
import { useCancelVendorBill, usePayVendorBill, usePostVendorBill, useVendorBill } from '@/features/purchases/hooks'
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
  const cancelBill = useCancelVendorBill(billId)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  if (isLoading) return <LoadingState rows={4} />
  if (isError || !bill) return <ErrorState message="Vendor bill not found." />

  const vendorName = contacts?.find((c) => c.id === bill.vendorId)?.name ?? `Vendor ${bill.vendorId}`
  const productName = (productId: number) => products?.find((p) => p.id === productId)?.name ?? `Product ${productId}`

  return (
    <div>
      <PageHeader
        title={`Vendor Bill ${bill.id}`}
        description={vendorName}
        backTo="/purchases/bills"
        actions={
          <div className="flex gap-2">
            {bill.status === 'draft' && (
              <Button variant="outline" onClick={() => setCancelDialogOpen(true)} disabled={cancelBill.isPending}>
                {cancelBill.isPending ? 'Cancelling...' : 'Cancel'}
              </Button>
            )}
            {bill.status === 'draft' && (
              <Button onClick={() => postBill.mutate()} disabled={postBill.isPending}>
                {postBill.isPending ? 'Posting...' : 'Post Bill'}
              </Button>
            )}
          </div>
        }
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel this vendor bill?"
        description="This cannot be undone. The bill will be marked as cancelled."
        confirmLabel="Cancel Bill"
        destructive
        onConfirm={() => cancelBill.mutate()}
      />

      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={bill.status} />
            <Link to={`/purchases/orders/${bill.purchaseOrderId}`} className="text-sm text-primary hover:underline">
              View Purchase Order {bill.purchaseOrderId}
            </Link>
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
